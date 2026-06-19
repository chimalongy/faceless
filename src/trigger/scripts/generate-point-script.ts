import { task, logger } from "@trigger.dev/sdk/v3";
import { llmGeneratePointScript } from "../../lib/apis/LLM-central.js";
import { supabase } from "../../lib/supabase";

type GeneratePointScriptPayload = {
  storyId: string;
  section: string;
  contentTheme?: string;
};

type Scene = {
  sceneNumber: number;
  title: string;
  duration: number;
  voiceText: string;
  numberOfImages: number;
  image_setup: {
    imageDuration: number;
    aiImagePrompts: string;
    visualDescription: string;
    transition_type: string;
  }[];
};

export const generatePointScript = task({
  id: "generate-point-script",

  run: async (payload: GeneratePointScriptPayload) => {
    const { storyId, section, contentTheme } = payload;

    // logger.info("📝 Generating script...", { storyId, section });
 logger.info("Generating script for section...");


    // Fetch story
    const { data: story, error } = await supabase
      .from("stories")
      .select("content, title")
      .eq("id", storyId)
      .single();

    if (error) {
      logger.error("❌ Failed to fetch story", { error });
      throw new Error("Failed to fetch story");
    }

    if (!story) {
      throw new Error("Story not found");
    }

    logger.info("📖 Story fetched", { title: story.title });

    // Generate scenes via centralized LLM
    logger.info("🤖 Calling LLM to generate script scenes");
    const parsed = await llmGeneratePointScript({
      storyTitle: story.title,
      section,
      storyContent: story.content,
      contentTheme,
    });
    logger.info("🤖 AI response received");

    const scenes: Scene[] = parsed.scenes || [];

    if (!Array.isArray(scenes) || scenes.length === 0) {
      throw new Error("AI returned empty scenes array");
    }

    // Validation
    for (const scene of scenes) {
      if (scene.numberOfImages !== scene.image_setup.length) {
        throw new Error(
          `Scene ${scene.sceneNumber} image count mismatch`
        );
      }

      for (const img of scene.image_setup) {
        if (!Number.isInteger(img.imageDuration)) {
          throw new Error(
            `Scene ${scene.sceneNumber} contains invalid imageDuration`
          );
        }
      }
    }

    logger.info("✅ Scenes validated", {
      totalScenes: scenes.length,
    });

    return {
      success: true,
      storyId,
      section,
      scenes,
    };
  },
});