import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import OpenAI from "openai";
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

    const client = new OpenAI({
      baseURL: process.env.BASE_TEN_BASE_URL,
      apiKey: process.env.BASE_TEN_API_KEY,
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

      // Improve prompt with LLM
      const response = await client.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V3.1",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are an expert cinematic AI image prompt engineer.

Enhance the prompt visually while keeping its meaning.

Return JSON:

{
 "modified_prompt": "string"
}
`,
          },
          {
            role: "user",
            content: `
STORY:
${story.content}

SCENE_NUMBER:
${sceneNumber}

IMAGE_NUMBER:
${i}

ORIGINAL_PROMPT:
${originalPrompt}

IMAGE_GENERATION_THEME:
${topic.image_generation_theme}
`,
          },
        ],
      });

      let enhancedPrompt = originalPrompt;

      try {
        const parsed = JSON.parse(
          response.choices[0].message.content || "{}"
        );
        enhancedPrompt = parsed.modified_prompt || originalPrompt;
      } catch {
        logger.warn("Failed to parse LLM response");
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

      // Save to DB
      const { error: insertError } = await supabase
        .from("story_images")
        .insert({
          story_id: story.id,
          image_url: sceneImage.url,
          scene_number: sceneNumber,
          image_number: i,
        });

      if (insertError) {
        throw insertError;
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