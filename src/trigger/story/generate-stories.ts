import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import OpenAI from "openai";
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

    const client = new OpenAI({
      baseURL: process.env.BASE_TEN_BASE_URL,
      apiKey: process.env.BASE_TEN_API_KEY,
    });

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

        const response = await client.chat.completions.create({
          model: "deepseek-ai/DeepSeek-V3.1",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `
You are a creative AI content writer for faceless YouTube channels. Generate ONE viral, highly engaging story that lasts about 20 minutes.

Return ONLY valid JSON in this exact structure:

{
  "title": "string",
  "content": {
    "introduction": "string",
    "points": [
      {
        "point_title": "string",
        "story": "string"
      }
    ]
  }
}

Rules:

1. Title must be unique, catchy, and intriguing.
2. Do NOT reuse any of these titles: ${alreadyCreatedTitlesString}
3. Story content must:
   - Begin with a clear "introduction".
   - Include multiple points as an array under "points".
   - Each point must have:
       - "point_title" relevant to the story title.
       - "story" explaining that point in detail.
   - Use simple, clear language.
   - Be highly engaging and captivating.
   - Be no less than 800 words in total.
4. Focus on ONE central story entity.
5. Align all content closely with the title.
6. Do not wrap JSON in markdown or backticks.
7. Do not include explanations or extra text outside JSON.

Topic details:
topic_name: ${topicName}
topic_description: ${topicDescription}
              `,
            },
            {
              role: "user",
              content: `
topic_name: ${topicName}
topic_description: ${topicDescription}
              `,
            },
          ],
        });

        let rawContent = response.choices[0]?.message?.content ?? "";
        logger.info("📦 Raw AI response received");

        rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsed: Story;

        try {
          parsed = JSON.parse(rawContent);
        } catch (parseError) {
          logger.error("❌ Failed to parse AI JSON response", { rawContent });
          throw new Error("Invalid AI JSON response format");
        }

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