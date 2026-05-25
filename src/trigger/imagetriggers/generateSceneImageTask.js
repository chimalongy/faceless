import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { llmEnhanceImagePrompt } from "../../lib/apis/LLM-central.js";
import { downloadandUploadImageToSupabase } from "../../lib/tasks/imagedownloader";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const generateSceneImageTask = task({
  id: "generate-scene-images",

  run: async (payload) => {
    const { storyId, scene } = payload;

    logger.info("Starting scene image generation", {
      storyId,
      sceneNumber: scene.sceneNumber,
    });



    // Fetch story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, content, generated_script, topic_id")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      throw new Error("Story not found");
    }

    // Fetch topic
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("image_generation_theme")
      .eq("id", story.topic_id)
      .single();

    if (topicError || !topic) {
      throw new Error("Topic not found");
    }

    const safeTitle = story.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    const sceneNumber = scene.sceneNumber;
    const sceneImageSetup = scene.image_setup;

    if (!sceneImageSetup || !sceneImageSetup.length) {
      logger.warn("Scene has no image setup", { sceneNumber });
      return { success: false };
    }

    for (let i = 0; i < sceneImageSetup.length; i++) {
      const imageSetup = sceneImageSetup[i];
      const originalPrompt = imageSetup.aiImagePrompts;

      logger.info("Improving image prompt", {
        sceneNumber,
        imageNumber: i,
      });

      // Improve prompt via centralized LLM
      let enhancedPrompt = originalPrompt;
      try {
        const parsed = await llmEnhanceImagePrompt({
          storyContent: story.content,
          sceneNumber,
          imageNumber: i,
          originalPrompt,
          imageGenerationTheme: topic.image_generation_theme,
        });
        enhancedPrompt = parsed.modified_prompt || originalPrompt;
      } catch {
        logger.warn("Failed to enhance image prompt via LLM, using original");
      }

      const destinationPath =
        `generated/images/${safeTitle}/scenes/${sceneNumber}/image_${i}.jpg`;

      // Generate image
      const sceneImage = await downloadandUploadImageToSupabase(
        sceneNumber,
        destinationPath,
        enhancedPrompt,
        logger
      );

      if (!sceneImage.success || !sceneImage.url) {
        throw new Error(
          `Image generation failed for scene ${sceneNumber}, image ${i}`
        );
      }

      // Save to DB (upsert)
      const { error: upsertError } = await supabase
        .from("story_images")
        .upsert(
          {
            story_id: story.id,
            image_url: sceneImage.url,
            scene_number: sceneNumber,
            image_number: i,
          },
          {
            onConflict: "story_id,scene_number,image_number", // columns that define uniqueness
          }
        );

      if (upsertError) {
        throw upsertError;
      }

      await delay(2000);

      logger.info("Image generated and saved", {
        sceneNumber,
        imageNumber: i,
      });
    }

    logger.info("Scene completed", { sceneNumber });

    return {
      success: true,
      sceneNumber,
    };
  },
});