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

    const generated_script = JSON.parse(story.generated_script);
    let scenes = generated_script.scenes;

    if (generation_type == "single") {
      let selected_scene = scenes.filter((s) => s.sceneNumber === selected_scene_number);
      scenes = selected_scene;
    }



    const sceneResults = [];

    for (const sceneRaw of scenes) {
      const scene = { ...sceneRaw };
      delete scene.duration;

      logger.log("Processing scene", { scene: scene.sceneNumber });

      const scene_audio = story_audio.find(
        (a) => a.scene_number === scene.sceneNumber
      );

      if (!scene_audio) {
        sceneResults.push({
          sceneNumber: scene.sceneNumber,
          success: false,
          error: "Audio not found",
        });
        continue;
      }

      const scene_images = story_images.filter(
        (img) => img.scene_number === scene.sceneNumber
      );

      const scene_audio_url = scene_audio.audio_url;

      const fileName =
        storyId + "_" + scene.sceneNumber + scene_audio.audio_format;

      const filePath = path.join(temp_audio_download_path, fileName);

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

      const slide_payload = {
        storyId,
        safeTitle,
        scene,
        scene_number: scene.sceneNumber,
        scene_images,
        scene_audio_url,
        scene_audio_duration: audio_length,
        ass_content: assContent,
        video_service_url,
      };

      logger.log("Triggering scene video worker", {
        scene: scene.sceneNumber,
      });

      const run = await getScriptVideo.triggerAndWait(slide_payload);

      const result = run.output;

      sceneResults.push(result);

      try {
        fs.unlinkSync(filePath);
      } catch { }
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