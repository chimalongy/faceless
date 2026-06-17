import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";

export const generateSceneAudioTask = task({
    id: "generate-scene-audio",

    run: async (payload) => {
        const {
            storyId,
            sceneNumber,
        } = payload;

        try {
            logger.info("🎙️ Starting scene audio generation", {
                storyId,
                sceneNumber: sceneNumber ?? "ALL",
            });

        // 🔹 Fetch story
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select("id, title, generated_script, channel_id")
            .eq("id", storyId)
            .single();

        if (storyError || !story) {
            throw new Error("Story not found");
        }

        // 🔹 Fetch channel narrator voice
        const { data: channel, error: channelError } = await supabase
            .from("channels")
            .select("narrator_voice")
            .eq("id", story.channel_id)
            .single();

        if (channelError) {
            logger.error("Error fetching channel narrator voice", { channelError });
        }

        const voiceName = channel?.narrator_voice || "af_heart";

        let scenes = [];

        try {
            scenes = JSON.parse(story.generated_script)?.scenes || [];
        } catch {
            throw new Error("Invalid generated_script JSON");
        }

        if (!scenes.length) {
            throw new Error("No scenes found");
        }

        // 🔹 If specific scene requested → filter
        const scenesToProcess = sceneNumber
            ? scenes.filter((s) => s.sceneNumber === sceneNumber)
            : scenes;

        if (!scenesToProcess.length) {
            throw new Error(`Scene ${sceneNumber} not found`);
        }

        const safeTitle = story.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

        const storedAudioUrls = [];

        for (const scene of scenesToProcess) {
            const currentSceneNumber = scene.sceneNumber;

            if (!scene.voiceText) continue;

            // 🔹 Skip if already exists
            const { data: existing } = await supabase
                .from("story_audio")
                .select("id")
                .eq("story_id", storyId)
                .eq("scene_number", currentSceneNumber)
                .maybeSingle();

            if (existing) {
                logger.info("⏭️ Skipping existing scene", { currentSceneNumber });
                continue;
            }

            const destinationPath = `generated/audio/${safeTitle}/scenes/${currentSceneNumber}.wav`;

            logger.info("🎙️ Generating speech using Kokoro TTS Modal API", {
                currentSceneNumber,
                voice: voiceName,
            });

            // 🔹 Call the exact Kokoro TTS synthesis endpoint requested by the user
            const modalResponse = await fetch(
                "https://geniusdomainnames--kokoro-tts-web.modal.run/synthesize",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: scene.voiceText,
                        voice: voiceName,
                        speed: 1.0,
                        format: "wav",
                    }),
                },
            );

            // 🔹 Check for errors
            if (!modalResponse.ok) {
                const errText = await modalResponse.text();
                throw new Error(
                    `Modal TTS API error: ${modalResponse.status} ${modalResponse.statusText} - ${errText}`,
                );
            }

            // 🔹 Get raw audio as ArrayBuffer
            const arrayBuffer = await modalResponse.arrayBuffer();

            // 🔹 Convert to Node.js Buffer
            const audioBuffer = Buffer.from(arrayBuffer);

            // 🔹 Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(process.env.SUPABASE_BUCKET)
                .upload(destinationPath, audioBuffer, {
                    contentType: "audio/wav",
                    upsert: true,
                });

            if (uploadError) {
                throw new Error(
                    `Supabase upload failed for scene ${currentSceneNumber}: ${uploadError.message}`,
                );
            }

            const { data: urlData } = supabase.storage
                .from(process.env.SUPABASE_BUCKET)
                .getPublicUrl(destinationPath);

            await supabase.from("story_audio").insert({
                story_id: story.id,
                audio_url: urlData.publicUrl,
                is_ai_generated: true,
                audio_format: "wav",
                scene_number: currentSceneNumber,
            });

            storedAudioUrls.push(urlData.publicUrl);

            logger.info("✅ Scene completed", { currentSceneNumber });
        }

        logger.info("🎉 Scene audio generation finished", {
            totalProcessed: storedAudioUrls.length,
        });

            return {
                success: true,
                storyId,
                processedScenes: storedAudioUrls.length,
                specificScene: sceneNumber ?? null,
            };
        } finally {
            await supabase
                .from("stories")
                .update({ is_audio_generating: false })
                .eq("id", storyId);
        }
    },
});