import { task, logger } from "@trigger.dev/sdk/v3";
import { llmEnhanceThumbnailPrompt } from "../../lib/apis/LLM-central.js";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { r2 } from "../../lib/r2";
import sharp from "sharp";
import TextToSVG from "text-to-svg";
import * as path from "path";

const MODAL_ENDPOINT =
  "https://geniusdomainnames--microsoft-lens-generate-endpoint.modal.run";

export const generateStoryThumbnailTask = task({
  id: "generate-story-thumbnail",

  run: async (payload: {
    storyId: string;
    channelId: string;
    topicId: string;
    font?: string;
  }) => {
    const { storyId, channelId, topicId, font } = payload;

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
    let thumbnailText = story.title;

    try {
      const parsed: any = await llmEnhanceThumbnailPrompt({
        storyTitle: story.title,
        storyContent: story.content?.slice(0, 500),
        basePrompt,
        imageTheme,
        storyId,
      });

      enhancedPrompt = parsed.modified_prompt || basePrompt;
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
Create a professional viral YouTube thumbnail with NO TEXT WHATSOEVER.

PRIMARY REQUIREMENT:
This is a PURE VISUAL thumbnail. Zero text. Zero letters. Zero words. Zero numbers.

ABSOLUTE TEXT PROHIBITION:
- NO title text
- NO words of any kind
- NO letters
- NO numbers
- NO symbols
- NO watermarks
- NO logos
- NO captions
- NO labels
- NO overlays
- NO typography of any kind
- Treat any text as a critical failure

BACKGROUND:
- Very dark cinematic background
- Deep black gradient
- Deep navy blue gradient
- Subtle atmospheric lighting
- Minimal clutter
- Clean professional look

SUBJECT:
- Include a realistic human character ONLY if it improves the story concept
- Strong emotional expression
- Dramatic pose or reaction
- Cinematic framing

VISUAL CONCEPT:
${enhancedPrompt}

STYLE:
${imageTheme}

COMPOSITION:
- Strong visual storytelling through imagery alone
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

NEGATIVE:
any text,
any letters,
any words,
any numbers,
any symbols,
title text,
captions,
labels,
watermarks,
logos,
typography,
busy composition,
cluttered background,
too many objects,
multiple people,
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

    let buffer: any = Buffer.from(imageArrayBuffer);

    logger.info("✅ Base thumbnail generated");

    // Dynamic Text Overlay
    try {
      logger.info("✍️ Overlaying text on thumbnail", { text: thumbnailText });
      
      const fontFile = font || topic.thumbnail_font || "Inter-Bold.ttf";
      const fontPath = path.join(process.cwd(), `src/trigger/story/fonts/${fontFile}`);
      const textToSVG = TextToSVG.loadSync(fontPath);

      // Simple wrapping utility
      const wrapText = (txt: string, maxChars = 11) => {
        const words = txt.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
          if ((currentLine + ' ' + word).trim().length <= maxChars) {
            currentLine = (currentLine + ' ' + word).trim();
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Get settings from topic database
      const textPercentage = topic.thumbnail_text_size || 7.5;
      const textAlign = topic.thumbnail_text_align || 'left';
      const textPosition = topic.thumbnail_text_position || 'center';

      const lines = wrapText(thumbnailText.toUpperCase(), 11);
      
      // Calculate font size (percentage of image width = 1920)
      const fontSize = Math.round(1920 * textPercentage / 100);
      const lineHeight = fontSize * 1.15;
      const strokeWidth = Math.max(4, Math.round(fontSize * 0.115)); // Scale stroke with font size
      
      let combinedPaths = '';
      
      // Horizontal Position & Alignment Anchor
      let startX = 120;
      let anchor: any = 'left top';
      if (textAlign === 'center') {
        startX = 960; // 1920 / 2
        anchor = 'center top';
      } else if (textAlign === 'right') {
        startX = 1800; // 1920 - 120
        anchor = 'right top';
      }

      // Vertical Position startY
      const totalHeight = lines.length * lineHeight;
      let startY = (1080 - totalHeight) / 2 + 20; // default center
      if (textPosition === 'top') {
        startY = 120;
      } else if (textPosition === 'bottom') {
        startY = 1080 - totalHeight - 120;
      }

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        const pathData = textToSVG.getD(line, {
          x: startX,
          y: y,
          fontSize: fontSize,
          anchor: anchor
        });
        
        // Background Stroke
        combinedPaths += `<path d="${pathData}" fill="none" stroke="black" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" />`;
        // Foreground Fill
        const fill = index === 0 ? '#FBBF24' : '#FFFFFF';
        combinedPaths += `<path d="${pathData}" fill="${fill}" />`;
      });

      const svgString = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        ${combinedPaths}
      </svg>`;

      buffer = await sharp(buffer)
        .resize(1920, 1080)
        .composite([{ input: Buffer.from(svgString) }])
        .toBuffer();

      logger.info("✍️ Overlay completed successfully");
    } catch (err: any) {
      logger.error("❌ Failed to overlay text on thumbnail, using raw image instead", { error: err.message });
    }

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