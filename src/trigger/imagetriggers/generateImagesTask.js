import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { generateSceneImageTask } from "./generateSceneImageTask.js";

export const generateImagesTask = task({
  id: "generate-images",

  run: async (payload) => {
    const { storyId } = payload;

    try {
      logger.info("Starting image generation dispatcher", { storyId });
    
    // Fetch story
    const { data: story, error } = await supabase
      .from("stories")
      .select("id, title, content, generated_script, topic_id")
      .eq("id", storyId)
      .single();

    if (error || !story) {
      logger.error("Story not found", { error });
      console.log("FAILED TO FETCH STORY")
      throw new Error("Story not found");
    }

    // Fetch topic image generation theme
    let imageGenerationTheme = null;
    if (story.topic_id) {
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("image_generation_theme")
        .eq("id", story.topic_id)
        .single();
      
      if (topicError) {
        logger.warn("Failed to fetch topic theme, continuing without it", { topicError });
      } else {
        imageGenerationTheme = topic?.image_generation_theme || null;
      }
    }
  
    let scenes = [];

    try {
      scenes = JSON.parse(story.generated_script)?.scenes || [];
    } catch (err) {
      logger.error("Invalid generated_script JSON", { err });
      throw new Error("Invalid generated_script JSON");
    }

    if (!scenes.length) {
      throw new Error("No scenes found");
    }

    logger.info("Triggering scene image tasks in parallel", {
      sceneCount: scenes.length,
    });

    // Trigger tasks in parallel using batchTriggerAndWait
    const batchItems = scenes.map((scene) => ({
      payload: {
        storyId,
        scene,
        storyTitle: story.title,
        storyContent: story.content,
        imageGenerationTheme,
      }
    }));

    await generateSceneImageTask.batchTriggerAndWait(batchItems);

      return {
        success: true,
        scenesTriggered: scenes.length,
      };
    } finally {
      await supabase
        .from("stories")
        .update({ is_image_generating: false })
        .eq("id", storyId);
    }
  },
}); 