import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { getAudioDurationInSeconds } from "../../lib/utils/getAudioDurationInSeconds";
import { getScriptVideo } from "./get-script-video";

import fs from "fs";
import path from "path";
import axios from "axios";

const temp_audio_download_path = path.join(process.cwd(), "temp_audio_files");

export const generateScriptFrames = task({
  id: "generate-script-frames",

  run: async (payload) => {
    const { storyId, video_service_url, generation_type, selected_scene_number } = payload;

    logger.info("Starting frame generation", payload);
    logger.info("video url", { video_service_url });


    if (!fs.existsSync(temp_audio_download_path)) {
      fs.mkdirSync(temp_audio_download_path, { recursive: true });
    }

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError) throw storyError;

    const safeTitle = story.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    const { data: story_audio } = await supabase
      .from("story_audio")
      .select("audio_url, scene_number, audio_format")
      .eq("story_id", storyId);

    const { data: story_images } = await supabase
      .from("story_images")
      .select("image_url, scene_number, image_number")
      .eq("story_id", storyId);

    // Fetch existing video frames
    const { data: existing_frames } = await supabase
      .from("story_video_frames")
      .select("scene_number")
      .eq("story_id", storyId);

    const generated_script = JSON.parse(story.generated_script);
    let scenes = generated_script.scenes;

    if (generation_type == "single") {
      let selected_scene = scenes.filter((s) => s.sceneNumber === selected_scene_number);
      scenes = selected_scene;
    }



    const sceneResults = [];

    // 1. Prepare slide payloads for all scenes in parallel
    const payloads = await Promise.all(
      scenes.map(async (sceneRaw) => {
        const scene = { ...sceneRaw };
        delete scene.duration;

        // Skip if scene video frame already exists (unless doing a single scene regeneration)
        const frameExists = existing_frames?.some(
          (f) => f.scene_number === scene.sceneNumber
        );
        if (frameExists && generation_type !== "single") {
          logger.info("⏭️ Skipping existing scene video", { sceneNumber: scene.sceneNumber });
          return { skipped: true, sceneNumber: scene.sceneNumber };
        }

        const scene_audio = story_audio.find(
          (a) => a.scene_number === scene.sceneNumber
        );

        if (!scene_audio) {
          return {
            skipped: false,
            success: false,
            sceneNumber: scene.sceneNumber,
            error: "Audio not found",
          };
        }

        const scene_images = story_images.filter(
          (img) => img.scene_number === scene.sceneNumber
        );

        const scene_audio_url = scene_audio.audio_url;
        const fileName = storyId + "_" + scene.sceneNumber + scene_audio.audio_format;
        const filePath = path.join(temp_audio_download_path, fileName);

        try {
          const audioDownload = await fetch(scene_audio_url);
          const buffer = Buffer.from(await audioDownload.arrayBuffer());

          fs.writeFileSync(filePath, buffer);

          const audio_length = await getAudioDurationInSeconds(filePath);

          logger.log("Audio duration calculated", {
            scene: scene.sceneNumber,
            duration: audio_length,
          });

          const transcription_response = await axios.post(
            "https://me-chimaobi--whisper-api-optimized-whisperservice-transcribe.modal.run",
            {
              url: scene_audio_url,
            }
          );

          const assContent = transcription_response.data.ass ?? "";

          return {
            skipped: false,
            success: true,
            sceneNumber: scene.sceneNumber,
            filePath,
            payload: {
              storyId,
              safeTitle,
              scene,
              scene_number: scene.sceneNumber,
              scene_images,
              scene_audio_url,
              scene_audio_duration: audio_length,
              ass_content: assContent,
              video_service_url,
            }
          };
        } catch (err) {
          logger.error("Failed to prepare scene payload", { sceneNumber: scene.sceneNumber, error: err.message });
          // Cleanup if file was written
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
          }
          return {
            skipped: false,
            success: false,
            sceneNumber: scene.sceneNumber,
            error: err.message || "Failed to prepare scene",
          };
        }
      })
    );

    // Filter out skipped/failed/successful prepared items
    const validItems = payloads.filter(item => item && item.success);
    const skippedOrFailedResults = payloads.filter(item => item && (item.skipped || !item.success)).map(item => {
      if (item.skipped) {
        return {
          sceneNumber: item.sceneNumber,
          success: true,
          skipped: true,
        };
      } else {
        return {
          sceneNumber: item.sceneNumber,
          success: false,
          error: item.error,
        };
      }
    });

    sceneResults.push(...skippedOrFailedResults);

    if (validItems.length > 0) {
      logger.info("Triggering scene video workers in batch", { count: validItems.length });
      
      const batchItems = validItems.map(item => ({
        payload: item.payload
      }));

      const runs = await getScriptVideo.batchTriggerAndWait(batchItems);

      // Process batch trigger results
      for (let i = 0; i < runs.length; i++) {
        const runResult = runs[i];
        if (runResult.ok) {
          sceneResults.push(runResult.output);
        } else {
          sceneResults.push({
            sceneNumber: validItems[i].sceneNumber,
            success: false,
            error: runResult.error?.message || "Batch video generation failed",
          });
        }
      }

      // Cleanup local temp audio files
      for (const item of validItems) {
        if (item.filePath && fs.existsSync(item.filePath)) {
          try {
            fs.unlinkSync(item.filePath);
          } catch (e) {
            logger.warn("Failed to delete temp audio file", { path: item.filePath, error: e.message });
          }
        }
      }
    }

    logger.log("Frame generation complete", {
      total: scenes.length,
      success: sceneResults.filter((s) => s.success).length,
    });

    return {
      success: true,
      scenes: sceneResults,
    };
  },
});