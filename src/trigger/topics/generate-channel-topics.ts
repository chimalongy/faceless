import { task, logger } from "@trigger.dev/sdk/v3";
import OpenAI from "openai";
import { supabase } from "../../lib/supabase";

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

    const client = new OpenAI({
      baseURL: process.env.BASE_TEN_BASE_URL,
      apiKey: process.env.BASE_TEN_API_KEY,
    });

    try {

      const { data: topics, error: topicError } = await supabase
        .from("topics")
        .select("name")
        .eq("channel_id", channelId);


      const topicNames = topics?.map(t => t.name) ?? [];

      // Join into a comma-separated string
      const topicString = topicNames.join(", ");

      const response = await client.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V3.1",

        // 🔥 Forces JSON output (if supported by BaseTen model)
        response_format: { type: "json_object" },

        messages: [
          {
            role: "system",
            content: `
You are an expert content strategist and visual designer for YouTube channels.

Your task is to generate ${topicCount} highly engaging and viral topic ideas for a YouTube channel based on the channel description provided by the user.

Instructions:

1. Output ONLY valid JSON. Do NOT include markdown, backticks, explanations, or any extra text.
2. The JSON must strictly follow this structure:

{
  "topics": [
    {
      "name": "string",
      "description": "string",
      "background_music_prompt": "string",
      "background_music_duration": "number",
      "story_
      "image_generation_theme": {
        "art_style": "string",
        "lighting": "string",
        "color_palette": "string",
        "mood": "string",
        "camera_style": "string",
        "detail_level": "string",
        "texture": "string"
      }
    }
  ]
}

3. Generate exactly ${topicCount} unique topics. No duplicates.
4. Each topic should be broad enough to inspire multiple video stories.
   - Each story can have sub-sections (e.g., "10 Brutal Stoic Rules That Will Rebuild Your Mind, Body & Heart").
   - The topic itself should serve as a foundation for many such stories.
5. The topic name must be compelling, concise, and attention-grabbing.
6. The description must be detailed, story-driven, and explain why this topic is interesting for a channel audience.
7. Generate a structured image_generation_theme for each topic:
   - Ensure visual consistency across all stories for this topic.
   - Include art_style, lighting, color_palette, mood, camera_style, detail_level, and texture.
   - The theme should be vivid and specific enough for AI image generation to follow consistently.
8. Do NOT generate topics that are similar to or overlap with any of these existing topics: ${topicString}.
9. Generate a background music prompt for each topic:
   - The prompt should be enough for AI music generation to follow consistently and generate an instrumental music with no vocals befitting for stories generated from the topic.
   - The length of the music must be 1 minute.
   - The music should be loopable.( the begining of the music must be able to align seamlessly with the end of the music )
   - The music must not be contain drum beat, piano and any other instruments that you think would be beffitting for the story. BUT NO VOCALS

Use your creativity to produce viral, audience-engaging ideas while strictly following the JSON structure above.
`
          },
          {
            role: "user",
            content: description,
          },
        ],
      });

      let content = response.choices[0]?.message?.content ?? "";

      logger.info("📦 Raw AI response received");

      // 🛡 Fallback cleanup if model still wraps in markdown
      content = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsed: TopicsResponse;

      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        logger.error("❌ Failed to parse AI JSON response", {
          rawContent: content,
        });
        throw new Error("Invalid AI JSON response format");
      }

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
