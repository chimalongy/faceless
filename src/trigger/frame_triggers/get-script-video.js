import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { getSlideConfiguration } from "../../lib/utils/getSlideConfiguration";
import axios from "axios";

export const getScriptVideo = task({
  id: "get-script-video",

  run: async (payload) => {
    try {
      let {
        storyId,
        safeTitle,
        scene,
        scene_number,
        scene_images,
        scene_audio_url,
        scene_audio_duration,
        ass_content,
        video_service_url,
      } = payload;

      logger.info("Getting frame result", { scene: scene_number });
      
      logger.info(payload)
      
       logger.info("Video Service Url: + video_service_url")
      const result = await getSlideConfiguration(payload);

      let { slides, audioUrl, assContent: subtitles, audioDuration } = result;

      if (!slides || slides.length === 0) {
        return {
          sceneNumber: scene_number,
          success: false,
          error: "No slides generated",
        };
      }

      const slides_has_zero_duration = slides.some((s) => s.duration === 0);

      if (slides_has_zero_duration) {
        const new_slide_length = audioDuration / slides.length;

        slides = slides.map((slide) => ({
          ...slide,
          duration: new_slide_length,
        }));
      }

      const scene_frame_upload_destination =
        `generated/video-frames/${safeTitle}/scenes/${scene_number}.mp4`;

        
       
      logger.log("Sending scene to video renderer", { scene: scene_number, video_service_url:video_service_url });

      const videoServiceResponse = await axios.post(
        video_service_url,
        {
          scene_frame_upload_destination,
          slides,
          audioUrl,
          assContent: subtitles,
          audioDuration,
          backgroundColor: "black",
          fps: 30,
        },
        { timeout: 180000 }
      );

      const data = videoServiceResponse.data;

      if (data.success) {
        const { error } = await supabase
          .from("story_video_frames")
          .upsert(
            {
              story_id: storyId,
              scene_number: scene_number,
              frame_video_url: data.videoUrl,
              frame_upload_path: scene_frame_upload_destination,
            },
            {
              onConflict: "story_id,scene_number",
            }
          );

        if (error) throw error;

        return {
          sceneNumber: scene_number,
          success: true,
          videoUrl: data.videoUrl,
        };
      }

      return {
        sceneNumber: scene_number,
        success: false,
        error: "Video generation failed",
      };
    } catch (error) {
      logger.error("Scene video generation failed", {
        scene: payload.scene_number,
        error: JSON.stringify(error)
      });

      return {
        sceneNumber: payload.scene_number,
        success: false,
        error: error?.message || "Unknown error occurred",
      };
    }
  },
});