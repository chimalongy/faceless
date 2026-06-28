import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
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
      .select("content, title, channel_id, topic_id")
      .eq("id", storyId)
      .single();

    if (error) {
      logger.error("❌ Failed to fetch story", { error });
      throw error;
    }

    if (!story) throw new Error("Story not found");

    // Fetch channel configurations to get content_theme
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("content_theme")
      .eq("id", story.channel_id)
      .single();

    if (channelError) {
      logger.error("❌ Failed to fetch channel details", { error: channelError });
    }

    const contentTheme = channel?.content_theme || "narrator";
    logger.info("🎬 Channel theme fetched", { contentTheme });

    // Fetch topic image generation theme
    let imageGenerationTheme = null;
    if (story.topic_id) {
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("image_generation_theme")
        .eq("id", story.topic_id)
        .single();
      
      if (topicError) {
        logger.warn("Failed to fetch topic theme for script generation", { topicError });
      } else {
        imageGenerationTheme = topic?.image_generation_theme || null;
      }
    }

    const content =
      typeof story.content === "string"
        ? JSON.parse(story.content)
        : story.content;

    const scripts: any[] = [];
    

    // Batch trigger the introduction and point scripts in parallel
    const batchItems = [
      {
        payload: {
          storyId,
          section: content.introduction,
          contentTheme,
          imageGenerationTheme,
        }
      },
      ...content.points.map((point: any) => ({
        payload: {
          storyId,
          section: point.story,
          contentTheme,
          imageGenerationTheme,
        }
      }))
    ];

    logger.info("🎬 Triggering script generation in batch", { count: batchItems.length });
    const results = await generatePointScript.batchTriggerAndWait(batchItems);

    // Process Introduction result
    const introResult = results.runs[0];
    if (!introResult.ok) {
      logger.error("❌ Introduction generation failed", { error: (introResult as any).error });
      throw new Error("Introduction script failed");
    }

    const introScenes = introResult.output.scenes;
    for (const scene of introScenes) {
      scene.sceneNumber = scripts.length + 1;
      scripts.push(scene);
    }
    logger.info("✅ Introduction scenes added");

    // Process Points results
    for (let index = 0; index < content.points.length; index++) {
      const pointResult = results.runs[index + 1];
      if (!pointResult.ok) {
        logger.error(`❌ Point ${index} generation failed`, { error: (pointResult as any).error });
        throw new Error(`Point ${index} script failed`);
      }

      const pointScenes = pointResult.output.scenes;
      for (const scene of pointScenes) {
        scene.sceneNumber = scripts.length + 1;
        scripts.push(scene);
      }
      logger.info(`✅ Point ${index} scenes added`);
    }

    const totalImages = scripts.reduce((sum, scene) => sum + scene.numberOfImages, 0);

    // ---------- SAVE ----------
    const { error: saveError } = await supabase
      .from("stories")
      .update({
        script_generated: true,
        generated_script: JSON.stringify({scenes:scripts}),
        total_images: totalImages,

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