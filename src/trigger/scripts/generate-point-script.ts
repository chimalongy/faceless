import { task, logger } from "@trigger.dev/sdk/v3";
import OpenAI from "openai";
import { supabase } from "../../lib/supabase";

type GeneratePointScriptPayload = {
  storyId: string;
  section: string;
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
    const { storyId, section } = payload;

    // logger.info("📝 Generating script...", { storyId, section });
 logger.info("Generating script for section...");
    const client = new OpenAI({
      baseURL: process.env.BASE_TEN_BASE_URL,
      apiKey: process.env.BASE_TEN_API_KEY,
    });

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

    // Generate scenes
    const response = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a professional storytelling assistant.

You will receive a full story and a specific section to work on.

Your task:
- Break the section into multiple cinematic scenes.
- Decide the number of images per scene.
- Ensure the image_setup length equals numberOfImages.

Return ONLY valid JSON.

Structure:

{
  "scenes": [
    {
      "sceneNumber": number,
      "title": string,
      "duration": number,
      "voiceText": string, 
      "numberOfImages": number,
      "image_setup": [
        {
          "imageDuration": number,
          "aiImagePrompts": string,
          "visualDescription": string,
          "transition_type": string
        }
      ]
    }
  ]
}

Rules:
- duration must be in seconds
- imageDuration must be integer
- image_setup length must equal numberOfImages
- transitions allowed: cut, fade, crossfade, fade_to_black
- aiImagePrompts must be cinematic and highly descriptive
- voiceText must be engaging and emotional
- imageDuration values should roughly match scene duration
`,
        },
        {
          role: "user",
          content: `
Story Title:
${story.title}

Section To Expand:
${section}

Full Story Context:
${story.content}
`,
        },
      ],
    });

    let parsed;

    try {
      const raw = response.choices?.[0]?.message?.content;

      if (!raw) {
        throw new Error("Empty response from AI");
      }

      logger.info("🤖 AI response received");

      parsed = JSON.parse(raw);
    } catch (err) {
      logger.error("❌ Failed to parse AI response", { err });
      throw new Error("Invalid JSON returned from AI");
    }

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