import { task, logger } from "@trigger.dev/sdk/v3";
import OpenAI from "openai";
import axios from "axios";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { r2 } from "../../lib/r2";
import { getImageGenerationUrls } from "../../lib/apis/image-gen-apis.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import TextToSVG from "text-to-svg";

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

    // 2. LLM Prompt Enhancement (LOCKED STYLE)
    const client = new OpenAI({
      baseURL: process.env.BASE_TEN_BASE_URL,
      apiKey: process.env.BASE_TEN_API_KEY,
    });

    logger.info("🧠 Enhancing thumbnail prompt");

    const llmResponse = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an expert YouTube thumbnail prompt engineer.

Your job is to maintain STRICT visual consistency across all thumbnails.

You MUST follow this EXACT structure.

ONLY change:
- HUMAN CHARACTER
- EMOTION

------------------------------------

[STYLE BASE]
cinematic youtube thumbnail, high contrast lighting, bold colors,
dark background, strong contrast subject, soft vignette,
ultra sharp, 4k, dramatic lighting, studio quality,
consistent color grading, professional youtube thumbnail style

[HUMAN CHARACTER]
a human character derived from the story

[EMOTION]
Highly exaggerated emotion (shock, fear, excitement, confusion) depending on the story

[COMPOSITION]
the human subject MUST be on the RIGHT, looking LEFT,
medium close-up,
blurred background,
EMPTY SPACE on LEFT for text (do not include text),
the human subject takes 30-40% of frame
DO NOT INCLUDE ANY FORM OF TEXT ON THE IMAGE

[STYLE LOCK]
same lighting, same color grading, same framing,
same camera angle, same subject scale,
NO style variation

------------------------------------

Return JSON:
{ "modified_prompt": "string" }
          `,
        },
        {
          role: "user",
          content: `
STORY TITLE: ${story.title}
CONTENT: ${story.content?.slice(0, 500)}
BASE PROMPT: ${basePrompt}
THEME: ${imageTheme}
          `,
        },
      ],
    });

    let enhancedPrompt = basePrompt;

    try {
      const parsed = JSON.parse(llmResponse.choices[0]?.message?.content || "{}");
      enhancedPrompt = parsed.modified_prompt || basePrompt;
    } catch (err: any) {
      logger.warn("Failed to parse enhanced prompt", { error: err.message });
    }

    logger.info("🎨 Final Prompt", { enhancedPrompt });

    // 3. Generate image (FAILOVER strategy, NOT looping all)
    const image_generation_urls = await getImageGenerationUrls("cloudfare_worker");

    let base64Image: string | null = null;

    const NEGATIVE_PROMPT = `
low quality, blurry, multiple subjects, extra people,
text in image, watermark, distorted face,
bad anatomy, inconsistent lighting, different styles
`;

    // Shuffle to avoid always hitting the same worker first
    const shuffledWorkers = [...image_generation_urls].sort(() => Math.random() - 0.5);

    for (const urlData of shuffledWorkers) {
      logger.info(`🖼️ Trying worker ${urlData.id}`);

      try {
        const response = await axios.post(
          urlData.value,
          {
            prompt: enhancedPrompt,
            negative_prompt: NEGATIVE_PROMPT,
            mode: "image",
            model: "@cf/bytedance/stable-diffusion-xl-lightning",
            width: 1280,
            height: 720,
          },
          {
            headers: {
              Authorization: `Bearer FACELESSSTUDIO`,
              "Content-Type": "application/json",
            },
            timeout: 90000,
          }
        );
 
        base64Image = response.data?.image;

        if (base64Image) {
          logger.info("✅ Image generated successfully", { workerId: urlData.id });
          break; // stop immediately
        }
      } catch (err: any) {
        logger.warn(`❌ Worker ${urlData.id} failed, trying next`, {
          error: err.message,
        });
      }
    }

    if (!base64Image) {
      throw new Error("All image generation workers failed");
    }

    // 4. Composite story title text onto the left side of the image
    logger.info("✍️ Adding story title text to thumbnail");

    const rawBuffer = Buffer.from(base64Image, "base64");

    // Image dimensions match the generation request: 1280x720
    const IMG_W = 1280;
    const IMG_H = 720;

    // --- Convert Text to SVG Paths directly (bulletproof across all OS/Cloud environments)
    // Trigger.dev preserves the directory structure in the root of the worker, so we use process.cwd()
    const fontPath = path.join(process.cwd(), "src/trigger/story/fonts/Inter-Bold.ttf");
    const textToSVG = TextToSVG.loadSync(fontPath);

    // Word-wrap helper: split title into lines that fit within maxWidth chars per line
    const wrapText = (text: string, maxCharsPerLine: number): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        if ((current + " " + word).trim().length > maxCharsPerLine) {
          if (current) lines.push(current.trim());
          current = word;
        } else {
          current = (current + " " + word).trim();
        }
      }
      if (current) lines.push(current.trim());
      return lines;
    };

    const title = story.title as string;
    const fontSize = 62;
    const lineHeight = fontSize * 1.25;
    const leftPadding = 48;
    const textAreaWidth = Math.round(IMG_W * 0.45); // left 45% of the frame
    const maxChars = Math.floor(textAreaWidth / (fontSize * 0.55));
    const lines = wrapText(title.toUpperCase(), maxChars);

    // Build SVG tspan elements for each line
    const totalTextHeight = lines.length * lineHeight;
    const startY = (IMG_H - totalTextHeight) / 2 + fontSize;

    // Pill backdrop dimensions (sits behind the text block)
    const pillPadX = 24;
    const pillPadY = 18;
    const pillW = textAreaWidth - leftPadding + pillPadX * 2;
    const pillH = totalTextHeight + pillPadY * 2;
    const pillX = leftPadding - pillPadX;
    const pillY = startY - fontSize - pillPadY;

    // Convert lines to SVG path geometries using TextToSVG
    const textPaths = lines
      .map(
        (line, i) =>
          textToSVG.getPath(
            line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
            {
              x: leftPadding,
              y: startY + i * lineHeight,
              fontSize: fontSize,
              anchor: "left baseline",
            }
          )
      )
      .join("");

    // Semi-transparent dark gradient on the left side for text legibility
    const svgOverlay = `
      <svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="leftFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#000000" stop-opacity="0.72" />
            <stop offset="70%"  stop-color="#000000" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </linearGradient>
        </defs>
        <!-- Dark gradient scrim on the left -->
        <rect x="0" y="0" width="${textAreaWidth + 80}" height="${IMG_H}" fill="url(#leftFade)" />
        <!-- Transparent pill backdrop behind the title text -->
        <rect
          x="${pillX}"
          y="${pillY}"
          width="${pillW}"
          height="${pillH}"
          rx="16"
          ry="16"
          fill="#000000"
          fill-opacity="0.45"
        />
        <!-- Story title text shadow layer -->
        <g
          fill="#000000"
          stroke="#000000"
          stroke-width="14"
          stroke-linejoin="round"
        >
          ${textPaths}
        </g>
        <!-- Story title text foreground (simulated Black weight using stroke) -->
        <g
          fill="#FFFFFF"
          stroke="#FFFFFF"
          stroke-width="3"
          stroke-linejoin="round"
        >
          ${textPaths}
        </g>
      </svg>`;

    const svgBuffer = Buffer.from(svgOverlay);

    const buffer = await sharp(rawBuffer)
      .resize(IMG_W, IMG_H, { fit: "cover" })
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toBuffer();

    logger.info("✅ Text overlay applied to thumbnail");

    // 5. Upload to R2
    logger.info("☁️ Uploading to R2");

    const fileName = `channels/${channelId}/topics/${topicId}/stories/${storyId}/thumbnail_${Date.now()}.jpg`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: "image/jpeg",
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