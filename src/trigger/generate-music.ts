import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../lib/supabase";

type GenerateMusicPayload = {
    topicId: string;
};

export const generateMusicTask = task({
    id: "generate-music",

    run: async (payload: GenerateMusicPayload) => {
        const { topicId } = payload;

        logger.info("🎵 Starting background music generation", { topicId });

        // 🔹 Fetch topic to derive song description + userId
        const { data: topic, error: topicError } = await supabase
            .from("topics")
            .select("id, name, description, user_id")
            .eq("id", topicId)
            .single();

        if (topicError || !topic) {
            throw new Error(`Topic not found: ${topicId}`);
        }

        // Use topic name (+ description if available) as the music prompt
        const song_description = topic.description
            ? `${topic.name} - ${topic.description}`
            : topic.name;

        const duration = 30; // default duration in seconds

        logger.info("🎶 Using music prompt", { song_description, duration });

        // 🔹 Call the Modal music generation endpoint
        const modalRes = await fetch(
            "https://confidence-ogbonna2000--ace-step-run-server.modal.run",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    caption: song_description,
                    duration: Number(duration),
                }),
            }
        );

        if (!modalRes.ok) {
            const err = await modalRes.text();
            logger.error("❌ Modal error", { err });
            throw new Error(`Modal API error: ${err}`);
        }

        const data = await modalRes.json();

        logger.info("✅ Audio received from Modal, uploading to Supabase...");

        const audio = Buffer.from(data.audio_files[0], "base64");

        const filename = `music_${Date.now()}.wav`;
        const path = `generated/music/${filename}`;

        const bucket = process.env.SUPABASE_BUCKET!;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, audio, {
                contentType: "audio/wav",
            });

        if (uploadError) {
            throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        const audioUrl = publicData.publicUrl;

        logger.info("✅ Music uploaded", { audioUrl });

        // 🔹 Save to topic_background_music
        const { error: insertError } = await supabase
            .from("topic_background_music")
            .insert({
                user_id: topic.user_id,
                topic_id: topicId,
                music_url: audioUrl,
                is_ai_generated: true,
                music_format: "wav",
                volume_level: 0.5,
            });

        if (insertError) {
            logger.warn("⚠️ Failed to save music record to DB", {
                error: insertError.message,
            });
        } else {
            logger.info("✅ Music record saved to topic_background_music", {
                topicId,
            });
        }

        return {
            success: true,
            audioUrl,
            topicId,
        };
    },
});
