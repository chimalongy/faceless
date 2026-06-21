import { task, logger } from "@trigger.dev/sdk/v3";
import { llmEnhanceThumbnailPrompt } from "../../lib/apis/LLM-central.js";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { r2 } from "../../lib/r2";

const MODAL_ENDPOINT =
  "https://geniusdomainnames--microsoft-lens-generate-endpoint.modal.run";

export const generateStoryThumbnailTask = task({
  id: "generate-story-thumbnail",

  run: async (payload: {
    storyId: string;
    channelId: string;
    topicId: string;
  }) => {
    const { storyId, channelId, topicId } = payload;

    logger.info("🎬 Starting story thumbnail generation", {
      storyId,
    });

    // Fetch Story + Topic
    const [
      { data: story, error: storyError },
      { data: topic, error: topicError },
    ] = await Promise.all([
      supabase
        .from("stories")
        .select("*")
        .eq("id", storyId)
        .single(),

      supabase
        .from("topics")
        .select("*")
        .eq("id", topicId)
        .single(),
    ]);

    if (storyError || !story || topicError || !topic) {
      logger.error("Story or Topic not found", {
        storyError,
        topicError,
      });

      throw new Error("Story or Topic not found");
    }

    const basePrompt = topic.story_thumbnail_prompt;
    const imageTheme = topic.image_generation_theme;

    logger.info("🧠 Enhancing thumbnail prompt");

    let enhancedPrompt = basePrompt;

    try {
      const parsed = await llmEnhanceThumbnailPrompt({
        storyTitle: story.title,
        storyContent: story.content?.slice(0, 500),
        basePrompt,
        imageTheme,
        storyId,
      });

      enhancedPrompt =
        parsed.modified_prompt || basePrompt;
    } catch (err: any) {
      logger.warn(
        "Failed to enhance thumbnail prompt",
        {
          error: err.message,
        }
      );
    }

    // Final Prompt Sent To Microsoft Lens
    const thumbnailPrompt = `
Create a professional viral YouTube thumbnail.

TITLE:
"${story.title}"

PRIMARY REQUIREMENT:
The title text is the MOST IMPORTANT element in the thumbnail.

TEXT RULES:
- Display the exact title: "${story.title}"
- Title occupies approximately 65% of the thumbnail width
- Massive bold cinematic typography
- Bright glowing letters
- Extremely readable on mobile devices
- Thick lettering
- High contrast
- Professional YouTube thumbnail style
- Large text dominates the composition
- Text must be the first thing viewers notice
- No tiny text
- No distorted letters
- No misspelled words
- No decorative fonts
- No text hidden behind objects
- No cropped text

BACKGROUND:
- Very dark cinematic background
- Deep black gradient
- Deep navy blue gradient
- Subtle atmospheric lighting
- Minimal clutter
- Strong contrast behind text
- Clean professional look
- Dark enough to make the title glow

SUBJECT:
- Include a realistic human character ONLY if it improves the story concept
- Character positioned on the right side
- Character occupies less space than the title
- Strong emotional expression
- Looking toward the title when appropriate

VISUAL CONCEPT:
${enhancedPrompt}

STYLE:
${imageTheme}

COMPOSITION:
- Title occupies approximately 65% of the image
- Subject occupies approximately 35% of the image
- Clean visual hierarchy
- Designed specifically for YouTube homepage visibility
- Mobile-first readability
- Thumbnail should remain clear when viewed at small sizes

QUALITY:
- Hyper realistic
- Cinematic lighting
- Ultra detailed
- Sharp focus
- High dynamic range
- Premium creator quality
- Viral finance channel thumbnail quality

NEGATIVE:
tiny text,
small title,
unreadable text,
blurry text,
low contrast text,
text behind objects,
cropped text,
busy composition,
cluttered background,
too many objects,
multiple people,
watermarks,
logos,
washed out colors
`.trim();

    logger.info("🖼️ Generating thumbnail image via Modal", {
      prompt: thumbnailPrompt,
    });

    const modalPayload = {
      prompt: thumbnailPrompt,
      resolution: 1440,
      aspect_ratio: "16:9",
      steps: 20,
      cfg: 5.0,
    };

    logger.info("✅ Calling Modal Service");

    const modalRes = await fetch(MODAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modalPayload),
    });

    if (!modalRes.ok) {
      const text = await modalRes.text();

      logger.error("Modal error", {
        status: modalRes.status,
        text,
      });

      throw new Error(
        `Modal returned ${modalRes.status}: ${text}`
      );
    }

    const imageArrayBuffer =
      await modalRes.arrayBuffer();

    const buffer = Buffer.from(imageArrayBuffer);

    logger.info("✅ Thumbnail generated");

    logger.info("☁️ Uploading to R2");

    const fileName =
      `channels/${channelId}` +
      `/topics/${topicId}` +
      `/stories/${storyId}` +
      `/thumbnail_${Date.now()}.png`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: "image/png",
      })
    );

    const publicUrl =
      `${process.env.R2_PUBLIC_URL}/${fileName}`;

    const { error: updateError } =
      await supabase
        .from("stories")
        .update({
          thumbnail_url: publicUrl,
        })
        .eq("id", storyId);

    if (updateError) {
      logger.error("DB update failed", {
        updateError,
      });

      throw updateError;
    }

    logger.info(
      "🎉 Thumbnail generation complete",
      {
        publicUrl,
      }
    );

    return {
      success: true,
      url: publicUrl,
      prompt: thumbnailPrompt,
    };
  },
});