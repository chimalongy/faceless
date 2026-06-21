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
  story_description: string;
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
  storyTitle?: string;
  storyPromptDescription?: string;
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
      storyTitle,
      storyPromptDescription,
    } = payload;



    logger.info("🎬 Generate stories task started", {
      userId,
      topicId,
      channelId,
      storyCount,
    });

    try {
      const generatedStories: Story[] = [];

      // Fetch channel configurations to get content_theme
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .select("content_theme")
        .eq("id", channelId)
        .single();

      if (channelError) {
        logger.error("❌ Failed to fetch channel details", { error: channelError });
      }

      const contentTheme = channel?.content_theme || "narrator";
      logger.info("🎬 Channel theme fetched", { contentTheme });

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
        const parsed = await llmGenerateStory({
          topicName,
          topicDescription,
          alreadyCreatedTitlesString,
          contentTheme,
          storyTitle,
          storyPromptDescription,
        }) as Story;
        logger.info("📦 AI response received");

        if (!parsed.title && storyTitle) {
          parsed.title = storyTitle;
        }

        // ✅ Validate structure
        if (
          !parsed.title ||
          !parsed.story_description ||
          !parsed.content?.introduction ||
          !Array.isArray(parsed.content.points) ||
          parsed.content.points.length === 0
        ) {
          logger.error("❌ Invalid story structure returned", { parsed });
          throw new Error("AI returned invalid story structure");
        }




        // Enhance introduction and points in a single batch in parallel
        const batchItems = [
          {
            payload: {
              story_title: parsed.title,
              story: JSON.stringify(parsed.content),
              section_title: "Introduction",
              section_content: parsed.content.introduction,
              contentTheme,
            }
          },
          ...parsed.content.points.map((point) => ({
            payload: {
              story_title: parsed.title,
              story: JSON.stringify(parsed.content),
              section_title: point.point_title,
              section_content: point.story,
              contentTheme,
            }
          }))
        ];

        logger.info("🎬 Triggering story sections enhancement in batch", { count: batchItems.length });
        const results = await generateStoryEnhancerTask.batchTriggerAndWait(batchItems);

        // Process results
        const introResult = results[0];
        if (!introResult.ok) {
          throw new Error(`Story enhancer failed for Introduction: ${introResult.error?.message || JSON.stringify(introResult.error)}`);
        }
        parsed.content.introduction = introResult.output.content;

        for (let j = 0; j < parsed.content.points.length; j++) {
          const pointResult = results[j + 1];
          if (!pointResult.ok) {
            throw new Error(`Story enhancer failed for point "${parsed.content.points[j].point_title}": ${pointResult.error?.message || JSON.stringify(pointResult.error)}`);
          }
          parsed.content.points[j].story = pointResult.output.content;
        }




        // Insert story into Supabase
        const { data: story, error } = await supabase
          .from("stories")
          .insert({
            user_id: userId,
            topic_id: topicId,
            channel_id: channelId,
            title: storyTitle || parsed.title,
            story_description: parsed.story_description,
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