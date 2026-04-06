import { task, logger } from "@trigger.dev/sdk/v3";
import OpenAI from "openai";
import axios from "axios";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { supabase } from "../../lib/supabase";
import { r2 } from "../../lib/r2";
import FormData from "form-data";

// ─── Constants ────────────────────────────────────────────────
const DEAPI_BASE_URL = "https://api.deapi.ai/api/v1/client";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

const deApiHeaders = {
    Authorization: `Bearer ${process.env.MUSIC_GEN}`,
    Accept: "application/json",
};

export const generateStoryThumbnailTask = task({
    id: "generate-story-thumbnail",
    run: async (payload: { storyId: string; channelId: string; topicId: string }) => {
        const { storyId, channelId, topicId } = payload;

        logger.info("═══════════════════════════════════════════════");
        logger.info("🎬 [STEP 0] Starting story thumbnail generation", { storyId, channelId, topicId });
        logger.info("═══════════════════════════════════════════════");

        // ── 1️⃣  Fetch story and topic data ───────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("📦 [STEP 1] Fetching story and topic from database", { storyId, topicId });

        const [{ data: story, error: storyError }, { data: topic, error: topicError }] =
            await Promise.all([
                supabase.from("stories").select("*").eq("id", storyId).single(),
                supabase.from("topics").select("*").eq("id", topicId).single(),
            ]);

        if (storyError || !story || topicError || !topic) {
            logger.error("❌ [STEP 1] Story or Topic not found", { storyError, topicError });
            throw new Error("Story or Topic not found");
        }

        const prompt = topic.story_thumbnail_prompt || "A cinematic YouTube thumbnail for a viral story";
        const imageTheme = topic.image_generation_theme;

        logger.info("✅ [STEP 1] Story and topic fetched successfully", {
            storyId,
            topicId,
            story_title: story.title,
            thumbnail_prompt: prompt,
            image_theme: imageTheme,
        });

        // ── 2️⃣  Fetch available txt2img models and find Flux1schnell ──
        logger.info("─────────────────────────────────────────────");
        logger.info("🔍 [STEP 2] Fetching available txt2img models from DeAPI", {
            endpoint: `${DEAPI_BASE_URL}/models`,
            filter: "txt2img",
        });

        let modelSlug: string;
        try {
            const modelsRes = await axios.get(`${DEAPI_BASE_URL}/models`, {
                headers: deApiHeaders,
                params: {
                    "filter[inference_types]": "txt2img",
                    per_page: 50,
                    page: 1,
                },
            });

            const models: any[] = modelsRes.data?.data ?? [];

            logger.info("📨 [STEP 2] Models response received", {
                http_status: modelsRes.status,
                total_models_returned: models.length,
                all_models: models.map((m) => ({ name: m.name, slug: m.slug })),
            });

            if (models.length === 0) {
                throw new Error("No txt2img models returned from DeAPI");
            }

            // Find Flux1schnell by slug or name, fall back to first model
            const flux = models.find(
                (m) =>
                    m.slug?.toLowerCase().includes("flux") &&
                    m.slug?.toLowerCase().includes("schnell")
            ) ?? models[0];

            modelSlug = flux.slug;

            logger.info("✅ [STEP 2] Model selected", {
                selected_slug: modelSlug,
                selected_name: flux.name,
                all_available_slugs: models.map((m) => m.slug),
            });
        } catch (err: any) {
            const detail = err.response?.data ?? err.message;
            logger.error("❌ [STEP 2] Failed to fetch models from DeAPI", {
                error_message: err.message,
                http_status: err.response?.status,
                deapi_error: detail,
            });
            throw new Error(`DeAPI model fetch failed: ${JSON.stringify(detail)}`);
        }

        // ── 3️⃣  Enhance prompt with LLM ──────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("🧠 [STEP 3] Enhancing thumbnail prompt with LLM", {
            storyId,
            original_prompt: prompt,
            image_theme: imageTheme,
        });

        const client = new OpenAI({
            baseURL: process.env.BASE_TEN_BASE_URL,
            apiKey: process.env.BASE_TEN_API_KEY,
        });

        let enhancedPrompt = prompt;
        try {
            const llmResponse = await client.chat.completions.create({
                model: "deepseek-ai/DeepSeek-V3.1",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content:
                            `You are an expert cinematic AI image prompt engineer. Enhance the prompt for a YouTube thumbnail to make it more engaging and clickworthy. 
                            
                            RUES
                              - The story text must be written as an overlay on the leftside.
                              - The story title must have a text align left.
                              - The story title color must be white with dark blue text-outline.
                              - Use a font that would make the image attractive and click worthy.
                            
                            
                            Return JSON structure: { \"modified_prompt\": \"string\" }`,
                    },
                    {
                        role: "user",
                        content: `STORY TITLE: ${story.title}\nCONTENT: ${story.content ? story.content.substring(0, 500) + "..." : ""}\nORIGINAL PROMPT: ${prompt}\nTHEME: ${imageTheme}`,
                    },
                ],
            });

            logger.info("📨 [STEP 3] LLM response received", {
                storyId,
                raw_content: llmResponse.choices[0]?.message?.content,
            });

            const parsed = JSON.parse(llmResponse.choices[0]?.message?.content || "{}");
            enhancedPrompt = parsed.modified_prompt || prompt;

            logger.info("✅ [STEP 3] Prompt enhanced successfully", {
                storyId,
                original_prompt: prompt,
                enhanced_prompt: enhancedPrompt,
            });
        } catch (err: any) {
            logger.warn("⚠️ [STEP 3] Failed to enhance prompt — using original", {
                storyId,
                error: err.message,
                fallback_prompt: prompt,
            });
        }

        // ── 4️⃣  Submit image generation job to DeAPI ─────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("🚀 [STEP 4] Submitting txt2img job to DeAPI", {
            endpoint: `${DEAPI_BASE_URL}/txt2img`,
            model_slug: modelSlug,
            storyId,
            width: 1280,
            height: 720,
            prompt: enhancedPrompt,
        });

        let request_id: string;
        try {
            const submitRes = await axios.post(
                `${DEAPI_BASE_URL}/txt2img`,
                {
                    prompt: enhancedPrompt,
                    model: modelSlug,
                    width: 1280,
                    height: 720,
                    steps: 4,       // Flux schnell works well at 4 steps
                    guidance: 0,    // Flux schnell doesn't use guidance
                    seed: -1,
                    loras: [],
                },
                {
                    headers: {
                        ...deApiHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );

            logger.info("📨 [STEP 4] Raw submit response from DeAPI", {
                http_status: submitRes.status,
                http_status_text: submitRes.statusText,
                response_data: submitRes.data,
            });

            request_id = submitRes.data?.data?.request_id;

            if (!request_id) {
                logger.error("❌ [STEP 4] No request_id in response", {
                    storyId,
                    full_response: submitRes.data,
                });
                throw new Error(`No request_id returned. Response: ${JSON.stringify(submitRes.data)}`);
            }

            logger.info("✅ [STEP 4] Image job submitted successfully", {
                request_id,
                storyId,
                model_slug: modelSlug,
            });
        } catch (err: any) {
            const detail = err.response?.data ?? err.message;
            logger.error("❌ [STEP 4] Failed to submit image generation job", {
                storyId,
                model_slug: modelSlug,
                error_message: err.message,
                http_status: err.response?.status,
                deapi_error: detail,
            });
            throw new Error(`DeAPI submit failed: ${JSON.stringify(detail)}`);
        }

        // ── 5️⃣  Poll for completion ───────────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("🔄 [STEP 5] Beginning polling loop", {
            request_id,
            storyId,
            poll_interval_ms: POLL_INTERVAL_MS,
            max_attempts: MAX_POLL_ATTEMPTS,
            poll_endpoint: `${DEAPI_BASE_URL}/request-status/${request_id}`,
        });

        let resultUrl: string | null = null;

        for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
            logger.info(`⏳ [STEP 5] Poll attempt ${attempt}/${MAX_POLL_ATTEMPTS} — waiting ${POLL_INTERVAL_MS}ms`, {
                request_id,
                storyId,
                attempt,
            });

            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

            let statusData: any;
            try {
                logger.info(`📡 [STEP 5] Sending status request`, {
                    request_id,
                    storyId,
                    attempt,
                    url: `${DEAPI_BASE_URL}/request-status/${request_id}`,
                });

                const statusRes = await axios.get(
                    `${DEAPI_BASE_URL}/request-status/${request_id}`,
                    { headers: deApiHeaders }
                );

                logger.info(`📨 [STEP 5] Raw status response`, {
                    request_id,
                    storyId,
                    attempt,
                    http_status: statusRes.status,
                    response_data: statusRes.data,
                });

                statusData = statusRes.data?.data;
            } catch (err: any) {
                const detail = err.response?.data ?? err.message;
                logger.warn(`⚠️ [STEP 5] Poll attempt ${attempt} failed — retrying`, {
                    request_id,
                    storyId,
                    attempt,
                    error_message: err.message,
                    http_status: err.response?.status,
                    deapi_error: detail,
                });
                continue;
            }

            const { status, progress, result_url, result } = statusData ?? {};

            logger.info(`📊 [STEP 5] Job status parsed`, {
                request_id,
                storyId,
                attempt,
                status,
                progress: progress ?? "not reported",
                result_url: result_url ?? "not yet available",
                result: result ?? "not yet available",
            });

            if (status === "done") {
                resultUrl = result_url ?? result;

                if (!resultUrl) {
                    logger.error("❌ [STEP 5] Job done but no result URL", {
                        request_id,
                        storyId,
                        attempt,
                        full_status_data: statusData,
                    });
                    throw new Error(`Job done but no result URL. Response: ${JSON.stringify(statusData)}`);
                }

                logger.info("✅ [STEP 5] Image generation complete!", {
                    request_id,
                    storyId,
                    attempt,
                    result_url: resultUrl,
                });
                break;
            }

            if (status === "error") {
                logger.error("❌ [STEP 5] DeAPI reported job failure", {
                    request_id,
                    storyId,
                    attempt,
                    full_status_data: statusData,
                });
                throw new Error(`DeAPI job failed. request_id=${request_id}. Response: ${JSON.stringify(statusData)}`);
            }

            logger.info(`🔁 [STEP 5] Job still in progress`, {
                request_id,
                storyId,
                attempt,
                status,
                progress: progress ?? "not reported",
                next_poll_in_ms: POLL_INTERVAL_MS,
            });

            if (attempt === MAX_POLL_ATTEMPTS) {
                logger.error("❌ [STEP 5] Polling timed out", {
                    request_id,
                    storyId,
                    total_attempts: MAX_POLL_ATTEMPTS,
                    total_time_ms: MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS,
                    last_status: status,
                });
                throw new Error(`Polling timed out after ${MAX_POLL_ATTEMPTS} attempts for request_id=${request_id}`);
            }
        }

        // ── 6️⃣  Download image binary ─────────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("⬇️ [STEP 6] Downloading image from DeAPI result URL", {
            request_id,
            storyId,
            result_url: resultUrl,
        });

        let imageBuffer: Buffer;
        try {
            const imageRes = await axios.get(resultUrl!, {
                responseType: "arraybuffer",
            });

            imageBuffer = Buffer.from(imageRes.data);

            logger.info("✅ [STEP 6] Image downloaded successfully", {
                request_id,
                storyId,
                bytes: imageBuffer.length,
                kb: (imageBuffer.length / 1024).toFixed(2),
                mb: (imageBuffer.length / 1024 / 1024).toFixed(2),
                http_status: imageRes.status,
                content_type: imageRes.headers["content-type"],
            });
        } catch (err: any) {
            const detail = err.response?.data ?? err.message;
            logger.error("❌ [STEP 6] Failed to download image", {
                request_id,
                storyId,
                result_url: resultUrl,
                error_message: err.message,
                http_status: err.response?.status,
                detail,
            });
            throw new Error(`Image download failed: ${JSON.stringify(detail)}`);
        }

        // ── 7️⃣  Upload to R2 ──────────────────────────────────────────
        const fileName = `channels/${channelId}/topics/${topicId}/stories/${storyId}/generated_thumbnail_${Date.now()}.jpg`;

        logger.info("─────────────────────────────────────────────");
        logger.info("☁️ [STEP 7] Uploading image to R2", {
            request_id,
            storyId,
            bucket: process.env.R2_BUCKET,
            file_name: fileName,
            file_size_bytes: imageBuffer.length,
        });

        let publicUrl: string;
        try {
            await r2.send(
                new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET,
                    Key: fileName,
                    Body: imageBuffer,
                    ContentType: "image/jpeg",
                })
            );

            publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

            logger.info("✅ [STEP 7] Image uploaded to R2 successfully", {
                request_id,
                storyId,
                file_name: fileName,
                public_url: publicUrl,
            });
        } catch (err: any) {
            logger.error("❌ [STEP 7] R2 upload failed", {
                request_id,
                storyId,
                file_name: fileName,
                error_message: err.message,
            });
            throw new Error(`R2 upload failed: ${err.message}`);
        }

        // ── 8️⃣  Update database ───────────────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("💾 [STEP 8] Updating story thumbnail_url in database", {
            request_id,
            storyId,
            public_url: publicUrl,
            table: "stories",
            column: "thumbnail_url",
        });

        try {
            const { error: updateError } = await supabase
                .from("stories")
                .update({ thumbnail_url: publicUrl })
                .eq("id", storyId);

            if (updateError) {
                logger.error("❌ [STEP 8] Supabase DB update returned an error", {
                    request_id,
                    storyId,
                    supabase_db_error: updateError,
                });
                throw updateError;
            }

            logger.info("✅ [STEP 8] Story updated with thumbnail URL", {
                request_id,
                storyId,
                thumbnail_url: publicUrl,
            });
        } catch (err: any) {
            logger.error("❌ [STEP 8] Database update failed", {
                request_id,
                storyId,
                error_message: err.message,
            });
            throw new Error(`DB update failed for story ${storyId}: ${err.message}`);
        }

        // ── ✅  Done ───────────────────────────────────────────────────
        logger.info("═══════════════════════════════════════════════");
        logger.info("🎉 [DONE] Story thumbnail generated successfully", {
            storyId,
            topicId,
            channelId,
            request_id,
            model_slug: modelSlug,
            thumbnail_url: publicUrl,
        });
        logger.info("═══════════════════════════════════════════════");

        return { success: true, url: publicUrl };
    },
});