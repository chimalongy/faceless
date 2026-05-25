import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { llmGenerateTopics } from "../../lib/apis/LLM-central.js";

type GenerateChannelTopicsPayload = {
  userId: string;
  channelId: string;
  description: string;
  count?: number;
};

type Topic = {
  name: string;
  description: string;
  background_music_prompt?: string;
  background_music_duration?: number;
  image_generation_theme: string;
  story_thumbnail_prompt: string
};

type TopicsResponse = {
  topics: Topic[];
};

export const generateChannelTopicsTask = task({
  id: "generate-channel-topics",

  run: async (payload: GenerateChannelTopicsPayload) => {
    const { userId, channelId, description, count = 5 } = payload;
    const topicCount = Math.min(20, Math.max(1, count));

    logger.info("🎯 Generate channel topics task started", {
      userId,
      channelId,
    });



    try {

      const { data: topics, error: topicError } = await supabase
        .from("topics")
        .select("name")
        .eq("channel_id", channelId);


      const topicNames = topics?.map(t => t.name) ?? [];

      // Join into a comma-separated string
      const topicString = topicNames.join(", ");

      logger.info("🤖 Calling LLM to generate topics");
      const parsed = await llmGenerateTopics({ description, topicCount, topicString }) as TopicsResponse;
      logger.info("📦 AI response received");

      // ✅ Basic validation
      if (
        !parsed.topics ||
        !Array.isArray(parsed.topics)
      ) {
        logger.error("AI did not return a topics array");
      } else if (parsed.topics.length !== topicCount) {
        logger.warn(`AI returned ${parsed.topics.length} topics, expected ${topicCount}`);
      }

      logger.info("✅ Topics generation completed", {
        channelId,
        topicsCount: parsed.topics.length,
      });


      for (const topic of parsed.topics) {

        //calling generate background music task from here.









        const image_theme = JSON.stringify(topic.image_generation_theme);
        const { error } = await supabase.from('topics').insert({
          user_id: userId,
          channel_id: channelId,
          name: topic.name,
          description: topic.description,
          background_music_prompt: topic.background_music_prompt ?? null,
          background_music_duration: topic.background_music_duration ?? null,
          image_generation_theme: image_theme,
          story_thumbnail_prompt: topic.story_thumbnail_prompt ?? null,
        });
        if (error) {
          logger.error("Failed to insert topic", { error, topic });
        }
      }

      return {
        success: true,
        channelId,
        topics: parsed.topics,
      };
    } catch (error: any) {
      logger.error("🔥 Topic generation failed", {
        channelId,
        error: error?.message || error,
      });

      throw error;
    }
  },
});
