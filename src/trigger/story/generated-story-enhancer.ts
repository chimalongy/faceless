import { task, logger } from "@trigger.dev/sdk/v3";
import { llmEnhanceStorySection } from "../../lib/apis/LLM-central.js";

type StorySection = {
  title: string;
  content: string;
};

type StoryEnhancerPayload = {
  story_title: string;
  story: string;
  section_title: string;
  section_content: string;
  contentTheme?: string;
};

export const generateStoryEnhancerTask = task({
  id: "generate-story-enhancer",
  run: async (payload: StoryEnhancerPayload) => {
    const { story_title, story, section_title, section_content, contentTheme } = payload;



    logger.info("🎬 Story enhancer task started", {
      story_title,
      section_title,
    });

    try {
      logger.info("🤖 Calling LLM to enhance story section");
      const parsed = await llmEnhanceStorySection({ story_title, story, section_title, section_content, contentTheme }) as StorySection;
      logger.info("📦 AI response received for enhancement");

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