// import { task, logger } from "@trigger.dev/sdk/v3";
// import OpenAI from "openai";
// import axios from "axios";
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { supabase } from "../../lib/supabase";
// import { r2 } from "../../lib/r2";
// import { getImageGenerationUrls } from "../../lib/apis/image-gen-apis.js";

// export const generateStoryThumbnailTask = task({
//   id: "generate-story-thumbnail",
//   run: async (payload: { storyId: string; channelId: string; topicId: string }) => {
//     const { storyId, channelId, topicId } = payload;

//     logger.info("🎬 Starting story thumbnail generation", { storyId });

//     // 1. Fetch story and topic data
//     const [{ data: story, error: storyError }, { data: topic, error: topicError }] = await Promise.all([
//       supabase.from("stories").select("*").eq("id", storyId).single(),
//       supabase.from("topics").select("*").eq("id", topicId).single(),
//     ]);

//     if (storyError || !story || topicError || !topic) {
//       logger.error("Story or Topic not found", { storyError, topicError });
//       throw new Error("Story or Topic not found");
//     }

//     const prompt = topic.story_thumbnail_prompt || "A cinematic YouTube thumbnail for a viral story";
//     const imageTheme = topic.image_generation_theme;

//     // 2. Enhance prompt with LLM
//     logger.info("Improving thumbnail prompt with LLM");
//     const client = new OpenAI({
//       baseURL: process.env.BASE_TEN_BASE_URL,
//       apiKey: process.env.BASE_TEN_API_KEY,
//     });

//     const llmResponse = await client.chat.completions.create({
//       model: "deepseek-ai/DeepSeek-V3.1",
//       response_format: { type: "json_object" },
//       messages: [
//         {
//           role: "system",
//           content: "You are an expert cinematic AI image prompt engineer. Enhance the prompt for a YouTube thumbnail to make it more engaging and clickworthy. Return JSON structure: { \"modified_prompt\": \"string\" }",
//         },
//         {
//           role: "user",
//           content: `STORY TITLE: ${story.title}\nCONTENT: ${story.content ? (story.content.substring(0, 500) + '...') : ''}\nORIGINAL PROMPT: ${prompt}\nTHEME: ${imageTheme}`,
//         },
//       ],
//     });

//     let enhancedPrompt = prompt;
//     try {
//       const parsed = JSON.parse(llmResponse.choices[0]?.message?.content || "{}");
//       enhancedPrompt = parsed.modified_prompt || prompt;
//     } catch (err: any) {
//       logger.warn("Failed to parse enhanced prompt, using original", { error: err.message });
//     }

//     // 3. Generate image via Cloudflare Worker
//     logger.info("Calling Cloudflare Workers for image generation", { prompt: enhancedPrompt });
//     const image_generation_urls = await getImageGenerationUrls("cloudfare_worker");
//     let base64Image = null;

//     for (const urlData of image_generation_urls) {
//       try {
//         const response = await axios.post(
//           urlData.value,
//           {
//             prompt: enhancedPrompt,
//             mode: "image",
//             model: "@cf/black-forest-labs/flux-1-schnell",
//           },
//           {
//             headers: {
//               Authorization: `Bearer FACELESSSTUDIO`,
//               "Content-Type": "application/json",
//             },
//             timeout: 90000,
//           }
//         );
//         base64Image = response.data?.image;
//         if (base64Image) {
//             logger.info("Successfully generated image from worker", { workerId: urlData.id });
//             break;
//         }
//       } catch (err: any) {
//         logger.warn(`Worker URL ${urlData.id} failed, trying next...`, { error: err.message });
//       }
//     }

//     if (!base64Image) {
//         throw new Error("All image generation workers failed");
//     }

//     // 4. Upload to R2
//     logger.info("Uploading generated thumbnail to R2");
//     const buffer = Buffer.from(base64Image, "base64");
//     const fileName = `channels/${channelId}/topics/${topicId}/stories/${storyId}/generated_thumbnail_${Date.now()}.jpg`;

//     await r2.send(new PutObjectCommand({
//       Bucket: process.env.R2_BUCKET,
//       Key: fileName,
//       Body: buffer,
//       ContentType: "image/jpeg",
//     }));

//     const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

//     // 5. Update Database
//     const { error: updateError } = await supabase
//       .from("stories")
//       .update({ thumbnail_url: publicUrl })
//       .eq("id", storyId);

//     if (updateError) {
//         logger.error("Failed to update story with thumbnail URL", { updateError });
//         throw updateError;
//     }

//     logger.info("✅ Story thumbnail generated and updated", { storyId, publicUrl });

//     return { success: true, url: publicUrl };
//   },
// });
