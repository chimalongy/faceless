import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../lib/supabase";
import { Client } from "@gradio/client";
import { downloadAndUploadToSupabase } from "../lib/tasks/audiodownloader";

type GenerateSceneAudioPayload = {
  storyId: string;
  sceneNumber?: number;
  audio_generation_link?: string;
  generation_mode?: "clone" | "link";
  voice_id?: string;
};

export const generateSceneAudioTask = task({
  id: "generate-scene-audio",

  run: async (payload: GenerateSceneAudioPayload) => {
    const {
      storyId,
      sceneNumber,
      audio_generation_link,
      generation_mode,
      voice_id,
    } = payload;

    logger.info("🎙️ Starting scene audio generation", {
      storyId,
      sceneNumber: sceneNumber ?? "ALL",
    });

    // 🔹 Fetch story
    const { data: story, error } = await supabase
      .from("stories")
      .select("id, title, generated_script")
      .eq("id", storyId)
      .single();

    if (error || !story) {
      throw new Error("Story not found");
    }

    let scenes: any[] = [];

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

    const storedAudioUrls: string[] = [];

    let client: any;
    let exampleAudio: Blob | undefined;

    // 🔹 Only init Gradio client if using link mode
    if (!generation_mode || generation_mode === "link") {
      const response = await fetch(
        "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
      );
      exampleAudio = await response.blob();
      client = await Client.connect(audio_generation_link!);
    }

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

      let audioUrlResult: { success: boolean; url: string };

      if (generation_mode === "clone") {
        // 🔹 Call the Modal TTS endpoint
        const modalResponse = await fetch(
          "https://confidence-ogbonna2000--pocket-tts-service-voicetts-tts.modal.run",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: scene.voiceText,
              voice: "alba", // optional: alba, marius, javert, jean, fantine, cosette, eponine, azelma
            }),
          },
        );
        // 🔹 Check for errors
        if (!modalResponse.ok) {
          throw new Error(
            `Modal API error: ${modalResponse.status} ${modalResponse.statusText}`,
          );
        }

        // 🔹 Get raw audio as ArrayBuffer
        const arrayBuffer = await modalResponse.arrayBuffer();

        // 🔹 Convert to Node.js Buffer
        const audioBuffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET!)
          .upload(destinationPath, audioBuffer, {
            contentType: "audio/wav",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Supabase upload failed for scene ${currentSceneNumber}: ${uploadError.message}`,
          );
        }

        const { data: urlData } = supabase.storage
          .from(process.env.SUPABASE_BUCKET!)
          .getPublicUrl(destinationPath);

        audioUrlResult = {
          success: true,
          url: urlData.publicUrl,
        };
      } else {
        // 🔹 Use Gradio link mode
        const result = await client.predict("/generate_speech", {
          text: scene.voiceText,
          mode: "Default Voices",
          preset_voice: "alba",
          clone_audio_path: exampleAudio,
        });

        let audioUrlResult = await downloadAndUploadToSupabase(
          result.data[0].url,
          destinationPath,
        );
      }

      if (!audioUrlResult.success) {
        throw new Error(`Audio failed for scene ${currentSceneNumber}`);
      }

      await supabase.from("story_audio").insert({
        story_id: story.id,
        audio_url: audioUrlResult.url,
        is_ai_generated: true,
        audio_format: "wav",
        scene_number: currentSceneNumber,
      });

      storedAudioUrls.push(audioUrlResult.url);

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
  },
});
