import { task, logger } from "@trigger.dev/sdk/v3";
import { llmEnhanceThumbnailPrompt } from "../../lib/apis/LLM-central.js";
import axios from "axios";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { r2 } from "../../lib/r2";
import { getImageGenerationUrls } from "../../lib/apis/getapis.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import TextToSVG from "text-to-svg";

const MODAL_ENDPOINT =
  "https://geniusdomainnames--microsoft-lens-generate-endpoint.modal.run";

export const generateStoryThumbnailTask = task({
  id: "generate-story-thumbnail",

  run: async (payload: { storyId: string; channelId: string; topicId: string }) => {
    const { storyId, channelId, topicId } = payload;

    logger.info("🎬 Starting story thumbnail generation", { storyId });

    // 1. Fetch data
    const [{ data: story, error: storyError }, { data: topic, error: topicError }] =
      await Promise.all([
        supabase.from("stories").select("*").eq("id", storyId).single(),
        supabase.from("topics").select("*").eq("id", topicId).single(),
      ]);

    if (storyError || !story || topicError || !topic) {
      logger.error("Story or Topic not found", { storyError, topicError });
      throw new Error("Story or Topic not found");
    }

    const basePrompt = topic.story_thumbnail_prompt;
    const imageTheme = topic.image_generation_theme;

    // 2. LLM Prompt Enhancement
    logger.info("🧠 Enhancing thumbnail prompt");

    let enhancedPrompt = basePrompt;
    try {
      const parsed = await llmEnhanceThumbnailPrompt({
        storyTitle: story.title,
        storyContent: story.content?.slice(0, 500),
        basePrompt,
        imageTheme,
      });
      enhancedPrompt = parsed.modified_prompt || basePrompt;
    } catch (err: any) {
      logger.warn("Failed to enhance thumbnail prompt", { error: err.message });
    }

    // 3. Call Modal endpoint directly
    logger.info("🖼️ Generating thumbnail image via Modal", { enhancedPrompt });

    const modalPayload = {
      prompt: enhancedPrompt.trim(),
      resolution: 1440,
      aspect_ratio: "16:9",
      steps: 20,
      cfg: 5.0,
    };
    logger.info("✅ Calling Modal Service");
    const modalRes = await fetch(MODAL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modalPayload),
    });

    if (!modalRes.ok) {
      const text = await modalRes.text();
      logger.error("Modal error", { status: modalRes.status, text });
      throw new Error(`Modal returned ${modalRes.status}: ${text}`);
    }

    // 4. Get image buffer
    const imageArrayBuffer = await modalRes.arrayBuffer();
    const buffer = Buffer.from(imageArrayBuffer);

    logger.info("✅ Thumbnail generated!");

    // 5. Upload to R2
    logger.info("☁️ Uploading to R2");

    const fileName = `channels/${channelId}/topics/${topicId}/stories/${storyId}/thumbnail_${Date.now()}.png`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: "image/png",
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // 6. Save to DB
    const { error: updateError } = await supabase
      .from("stories")
      .update({ thumbnail_url: publicUrl })
      .eq("id", storyId);

    if (updateError) {
      logger.error("DB update failed", { updateError });
      throw updateError;
    }

    logger.info("🎉 Thumbnail generation complete", { publicUrl });

    return {
      success: true,
      url: publicUrl,
      prompt: enhancedPrompt,
    };
  },
});