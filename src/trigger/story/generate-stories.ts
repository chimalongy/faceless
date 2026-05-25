import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { llmGenerateStory } from "../../lib/apis/LLM-central.js";
import { generateStoryEnhancerTask } from "./generated-story-enhancer";

type Point = {
  point_title: string;
  story: string;
};

type Story = {
  title: string;
  content: {
    introduction: string;
    points: Point[];
  };
};

type GenerateStoriesPayload = {
  userId: string;
  topicId: string;
  topicName: string;
  topicDescription: string;
  channelId: string;
  storyCount: number;
  socialMediaTarget?: string;
};

export const generateStoriesTask = task({
  id: "generate-stories",
  run: async (payload: GenerateStoriesPayload) => {
    const {
      userId,
      topicId,
      channelId,
      topicName,
      topicDescription,
      storyCount,
      socialMediaTarget,
    } = payload;



    logger.info("🎬 Generate stories task started", {
      userId,
      topicId,
      channelId,
      storyCount,
    });

    try {
      const generatedStories: Story[] = [];

      // Fetch already generated stories from database
      const { data: existingStories, error: existingStoriesError } =
        await supabase
          .from("stories")
          .select("title")
          .eq("topic_id", topicId);

      if (existingStoriesError) {
        logger.error("❌ Failed to fetch existing stories", {
          error: existingStoriesError,
        });
        throw existingStoriesError;
      }

      const alreadyCreatedTitles = existingStories?.map((s) => s.title) || [];
      const alreadyCreatedTitlesString = alreadyCreatedTitles.join(", ");

      for (let i = 0; i < storyCount; i++) {
        logger.info(`📝 Generating story ${i + 1} of ${storyCount}`);

        logger.info("🤖 Calling LLM to generate story");
        const parsed = await llmGenerateStory({ topicName, topicDescription, alreadyCreatedTitlesString }) as Story;
        logger.info("📦 AI response received");

        // ✅ Validate structure
        if (
          !parsed.title ||
          !parsed.content?.introduction ||
          !Array.isArray(parsed.content.points) ||
          parsed.content.points.length === 0
        ) {
          logger.error("❌ Invalid story structure returned", { parsed });
          throw new Error("AI returned invalid story structure");
        }




        // Enhance introduction
        const enhancedIntroResult = await generateStoryEnhancerTask.triggerAndWait({
          story_title: parsed.title,
          story: JSON.stringify(parsed.content),
          section_title: "Introduction",
          section_content: parsed.content.introduction,
        });

        if (!enhancedIntroResult.ok) {
          throw new Error(
            `Story enhancer failed for Introduction: ${enhancedIntroResult}`
          );
        }

        parsed.content.introduction = enhancedIntroResult.output.content;

        // Enhance each point
        for (let j = 0; j < parsed.content.points.length; j++) {
          const point = parsed.content.points[j];
          const enhancedPointResult = await generateStoryEnhancerTask.triggerAndWait({
            story_title: parsed.title,
            story: JSON.stringify(parsed.content),
            section_title: point.point_title,
            section_content: point.story,
          });

          if (!enhancedPointResult.ok) {
            throw new Error(
              `Story enhancer failed for point "${point.point_title}": ${enhancedPointResult}`
            );
          }

          point.story = enhancedPointResult.output.content;
        }




        // Insert story into Supabase
        const { data: story, error } = await supabase
          .from("stories")
          .insert({
            user_id: userId,
            topic_id: topicId,
            channel_id: channelId,
            title: parsed.title,
            content: JSON.stringify(parsed.content),
            social_media_target: socialMediaTarget,
            script_generated: false,
          })
          .select()
          .single();

        if (error) {
          logger.error(`❌ Failed to insert story ${i + 1}`, { error });
          throw error;
        }

        generatedStories.push(story);
        logger.info(`✅ Story ${i + 1} created`, { storyId: story.id });
      }

      logger.info("🎉 All stories generated successfully", {
        count: generatedStories.length,
      });

      return generatedStories;
    } catch (error: any) {
      logger.error("🔥 Story generation failed", {
        channelId,
        error: error?.message || error,
      });
      throw error;
    }
  },
});