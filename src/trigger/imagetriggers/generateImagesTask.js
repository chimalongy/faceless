import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { generateSceneImageTask } from "./generateSceneImageTask .js";

export const generateImagesTask = task({
  id: "generate-images",

  run: async (payload) => {
    const { storyId } = payload;

    logger.info("Starting image generation dispatcher", { storyId });
    
    // Fetch story
    const { data: story, error } = await supabase
      .from("stories")
      .select("id, generated_script")
      .eq("id", storyId)
      .single();

    if (error || !story) {
      logger.error("Story not found", { error });
        console.log("FAILED TO FETCH STORY")
      throw new Error("Story not found");
    
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

    logger.info("Triggering scene image tasks", {
      sceneCount: scenes.length,
    });

    // Trigger tasks in parallel
    for (const scene of scenes) {
  await generateSceneImageTask.triggerAndWait({
    storyId,
    scene,
  });
}

    return {
      success: true,
      scenesTriggered: scenes.length,
    };
  },
});