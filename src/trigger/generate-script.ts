import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../lib/supabase";
import { generatePointScript } from "./generate-point-script";

type GenerateScriptPayload = {
  storyId: string;
};

export const generateScriptTask = task({
  id: "generate-script",

  run: async (payload: GenerateScriptPayload) => {
    const { storyId } = payload;

    logger.info("📝 Generating script...", { storyId });

    const { data: story, error } = await supabase
      .from("stories")
      .select("content, title")
      .eq("id", storyId)
      .single();

    if (error) {
      logger.error("❌ Failed to fetch story", { error });
      throw error;
    }

    if (!story) throw new Error("Story not found");

    const content =
      typeof story.content === "string"
        ? JSON.parse(story.content)
        : story.content;

    const scripts: any[] = [];

    // ---------- INTRODUCTION ----------
    const introductionResult =
      await generatePointScript.triggerAndWait({
        storyId,
        section: content.introduction,
      });

    if (!introductionResult.ok) {
      logger.error("❌ Introduction generation failed");
      throw new Error("Introduction script failed");
    }

    const introScenes = introductionResult.output.scenes;

    for (const scene of introScenes) {
      scene.sceneNumber = scripts.length + 1;
      scripts.push(scene);
    }

    logger.info("✅ Introduction scenes added");

    // ---------- POINTS ----------
    const points = content.points;

    for (let index = 0; index < points.length; index++) {
      const point = points[index];

      const pointResult = await generatePointScript.triggerAndWait({
        storyId,
        section: point.story,
      });

      if (!pointResult.ok) {
        logger.error(`❌ Point ${index} generation failed`);
        throw new Error(`Point ${index} script failed`);
      }

      const pointScenes = pointResult.output.scenes;

      for (const scene of pointScenes) {
        scene.sceneNumber = scripts.length + 1;
        scripts.push(scene);
      }

      logger.info(`✅ Point ${index} scenes added`);
    }

    // ---------- SAVE ----------
    const { error: saveError } = await supabase
      .from("stories")
      .update({
        script_generated: true,
        generated_script: JSON.stringify({scenes:scripts}),
      })
      .eq("id", storyId);

    if (saveError) {
      logger.error("❌ Failed to save script", { saveError });
      throw new Error("Failed to save script");
    }

    logger.info("✅ Script generated successfully", {
      totalScenes: scripts.length,
    });

    return {
      success: true,
      storyId,
      totalScenes: scripts.length,
    };
  },
});