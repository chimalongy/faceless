import { task, logger } from "@trigger.dev/sdk/v3";
import OpenAI from "openai";

type StorySection = {
  title: string;
  content: string;
};

type StoryEnhancerPayload = {
  story_title: string;
  story: string;
  section_title: string;
  section_content: string;
};

export const generateStoryEnhancerTask = task({
  id: "generate-story-enhancer",
  run: async (payload: StoryEnhancerPayload) => {
    const { story_title, story, section_title, section_content } = payload;

    const client = new OpenAI({
      baseURL: process.env.BASE_TEN_BASE_URL,
      apiKey: process.env.BASE_TEN_API_KEY,
    });

    logger.info("🎬 Story enhancer task started", {
      story_title,
      section_title,
    });

    try {
      const response = await client.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V3.1",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are a professional content writer specializing in faceless YouTube channels. 
Enhance a section of a story to make it more engaging, vivid, and compelling.

Return ONLY valid JSON:

{
  "title": "string",       
  "content": "string"      
}

Do not include anything outside JSON. Do not wrap in markdown or code fences.
            `,
          },
          {
            role: "user",
            content: `
story_title: ${story_title}
story: ${story}
section_title: ${section_title}
section_content: ${section_content}
            `,
          },
        ],
      });

      let rawContent = response.choices[0]?.message?.content ?? "";
      logger.info("📦 Raw AI response received for enhancement");

      rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsed: StorySection;

      try {
        parsed = JSON.parse(rawContent);
      } catch (parseError) {
        logger.error("❌ Failed to parse AI JSON response", { rawContent });
        throw new Error("Invalid AI JSON response format");
      }

      if (!parsed?.title || !parsed?.content) {
        logger.error("❌ Invalid story structure returned", { parsed });
        throw new Error("AI returned invalid story structure");
      }

      return parsed;
    } catch (error: any) {
      logger.error("🔥 Story enhancement failed", {
        error: error?.message || error,
      });
      throw error;
    }
  },
});