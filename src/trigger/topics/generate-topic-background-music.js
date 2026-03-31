import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import axios from "axios";

export const GenerateTopicBackgroundMusic = task({
    id: "generate-topic-background-music",

    run: async (payload) => {
        const { topic_id, music_prompt, music_length } = payload;

        logger.info("Starting to Generate Topic Background Music", { topic_id });

        // 1️⃣ Request music generation from DeAPI
        const generationResponse = await axios.post(
            "https://api.deapi.ai/api/v1/client/txt2music",
            {
                caption: music_prompt,
                model: "AceStep_1_5_Turbo",
                duration: music_length,
                inference_steps: 8,
                guidance_scale: 1,
                seed: -1,
                format: "flac",
                vocal_language: "unknown",
                lyrics: "",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${process.env.MUSIC_GEN}`, // ✅ fixed: was a string literal
                },
            }
        );

        logger.info("Music generation response received", generationResponse.data);

        // 2️⃣ Extract the audio URL from the response
        // Adjust this depending on DeAPI's actual response shape
        const audioUrl = generationResponse.data?.url ?? generationResponse.data?.audio_url;
        if (!audioUrl) {
            throw new Error(`No audio URL returned from DeAPI. Response: ${JSON.stringify(generationResponse.data)}`);
        }

        logger.info("Downloading audio from DeAPI", { audioUrl });

        // 3️⃣ Download the audio binary
        const audioResponse = await axios.get(audioUrl, {
            responseType: "arraybuffer", // ✅ required for binary audio
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        // 4️⃣ Upload to Supabase Storage
        const destinationPath = `topics/${topic_id}/background_music.flac`;
        const bucketName = process.env.SUPABASE_BUCKET;

        logger.info("Uploading audio to Supabase", { destinationPath });

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(destinationPath, audioBuffer, {
                contentType: "audio/flac", // ✅ fixed: was placeholder string
                upsert: true,
            });

        if (uploadError) throw uploadError;
        if (!uploadData?.path) throw new Error("Supabase upload failed — no path returned");

        // 5️⃣ Get the public URL
        const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(uploadData.path);

        if (!publicData?.publicUrl) throw new Error("Failed to get public URL from Supabase");

        logger.info("Audio uploaded successfully", { publicUrl: publicData.publicUrl });

        // 6️⃣ Save public URL to the topic's background_music_url column
        const { error: dbError } = await supabase
            .from("topics")
            .update({ background_music_url: publicData.publicUrl })
            .eq("id", topic_id);

        if (dbError) throw dbError;

        logger.info("Topic background_music_url updated", { topic_id, url: publicData.publicUrl });

        return {
            success: true,
            topic_id,
            background_music_url: publicData.publicUrl,
        };
    },
});