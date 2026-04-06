import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import axios from "axios";
import FormData from "form-data";

// ─── Constants ────────────────────────────────────────────────
const DEAPI_BASE_URL = "https://api.deapi.ai/api/v1/client";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

const deApiHeaders = {
    Authorization: `Bearer ${process.env.MUSIC_GEN}`,
    Accept: "application/json",
};

// ─── Task ─────────────────────────────────────────────────────
export const GenerateTopicBackgroundMusic = task({
    id: "generate-topic-background-music",

    run: async (payload) => {
        const { topic_id, music_prompt, music_length } = payload;

        logger.info("═══════════════════════════════════════════════");
        logger.info("🎵 [STEP 0] Task started", {
            topic_id,
            music_prompt,
            music_length,
        });
        logger.info("═══════════════════════════════════════════════");

        // ── 1️⃣  Fetch available music models and pick the first slug ──
        logger.info("─────────────────────────────────────────────");
        logger.info("🔍 [STEP 1] Fetching available txt2music models from DeAPI", {
            endpoint: `${DEAPI_BASE_URL}/models`,
            filter: "txt2music",
        });

        let modelSlug;
        try {
            const modelsRes = await axios.get(`${DEAPI_BASE_URL}/models`, {
                headers: deApiHeaders,
                params: {
                    "filter[inference_types]": "txt2music",
                    per_page: 15,
                    page: 1,
                },
            });

            logger.info("📨 [STEP 1] Raw models response received", {
                http_status: modelsRes.status,
                total_models_returned: modelsRes.data?.data?.length ?? 0,
                models: modelsRes.data?.data?.map((m) => ({
                    name: m.name,
                    slug: m.slug,
                    inference_types: m.inference_types,
                    limits: m.info?.limits ?? "none",
                })),
            });

            const models = modelsRes.data?.data ?? [];

            if (models.length === 0) {
                throw new Error("No txt2music models returned from DeAPI models endpoint");
            }

            // Pick the first available model
            modelSlug = models[0].slug;

            logger.info("✅ [STEP 1] Model selected", {
                selected_slug: modelSlug,
                selected_name: models[0].name,
                all_available_slugs: models.map((m) => m.slug),
            });
        } catch (err) {
            const detail = err.response?.data ?? err.message;
            logger.error("❌ [STEP 1] Failed to fetch models from DeAPI", {
                error_message: err.message,
                http_status: err.response?.status,
                deapi_error: detail,
            });
            throw new Error(`DeAPI model fetch failed: ${JSON.stringify(detail)}`);
        }

        // ── 2️⃣  Submit music generation job ──────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("🚀 [STEP 2] Submitting music generation job to DeAPI", {
            endpoint: `${DEAPI_BASE_URL}/txt2music`,
            model_slug: modelSlug,
            topic_id,
            music_prompt,
            music_length,
        });

        let request_id;
        try {
            const form = new FormData();
            form.append("caption", music_prompt);
            form.append("model", modelSlug);
            form.append("duration", String(music_length));
            form.append("inference_steps", "8");
            form.append("guidance_scale", "1");
            form.append("seed", "-1");
            form.append("format", "flac");
            form.append("lyrics", "[Instrumental]");
            form.append("vocal_language", "unknown");

            logger.info("📦 [STEP 2] Form data built, sending POST request...", {
                model: modelSlug,
                duration: music_length,
                inference_steps: 8,
                guidance_scale: 7,
                format: "flac",
            });

            const submitRes = await axios.post(
                `${DEAPI_BASE_URL}/txt2music`,
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        ...deApiHeaders,
                    },
                }
            );

            logger.info("📨 [STEP 2] Raw response received from DeAPI", {
                http_status: submitRes.status,
                http_status_text: submitRes.statusText,
                response_data: submitRes.data,
            });

            request_id = submitRes.data?.data?.request_id;

            if (!request_id) {
                logger.error("❌ [STEP 2] No request_id found in response", {
                    full_response: submitRes.data,
                });
                throw new Error(
                    `No request_id returned. Response: ${JSON.stringify(submitRes.data)}`
                );
            }

            logger.info("✅ [STEP 2] Music job submitted successfully", {
                request_id,
                topic_id,
                model_slug: modelSlug,
            });
        } catch (err) {
            const detail = err.response?.data ?? err.message;
            logger.error("❌ [STEP 2] Failed to submit music generation job", {
                topic_id,
                model_slug: modelSlug,
                error_message: err.message,
                http_status: err.response?.status,
                deapi_error: detail,
            });
            throw new Error(`DeAPI submit failed: ${JSON.stringify(detail)}`);
        }

        // ── 3️⃣  Poll for completion ───────────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("🔄 [STEP 3] Beginning polling loop", {
            request_id,
            poll_interval_ms: POLL_INTERVAL_MS,
            max_attempts: MAX_POLL_ATTEMPTS,
            poll_endpoint: `${DEAPI_BASE_URL}/request-status/${request_id}`,
        });

        let resultUrl = null;

        for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
            logger.info(`⏳ [STEP 3] Poll attempt ${attempt}/${MAX_POLL_ATTEMPTS} — waiting ${POLL_INTERVAL_MS}ms`, {
                request_id,
                attempt,
            });

            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

            let statusData;
            try {
                logger.info(`📡 [STEP 3] Sending status request`, {
                    request_id,
                    attempt,
                    url: `${DEAPI_BASE_URL}/request-status/${request_id}`,
                });

                const statusRes = await axios.get(
                    `${DEAPI_BASE_URL}/request-status/${request_id}`,
                    { headers: deApiHeaders }
                );

                logger.info(`📨 [STEP 3] Raw status response received`, {
                    request_id,
                    attempt,
                    http_status: statusRes.status,
                    response_data: statusRes.data,
                });

                statusData = statusRes.data?.data;
            } catch (err) {
                const detail = err.response?.data ?? err.message;
                logger.warn(`⚠️ [STEP 3] Poll attempt ${attempt} encountered an error — will retry`, {
                    request_id,
                    attempt,
                    error_message: err.message,
                    http_status: err.response?.status,
                    deapi_error: detail,
                });
                continue;
            }

            const { status, progress, result_url, result } = statusData ?? {};

            logger.info(`📊 [STEP 3] Job status parsed`, {
                request_id,
                attempt,
                status,
                progress: progress ?? "not reported",
                result_url: result_url ?? "not yet available",
                result: result ?? "not yet available",
            });

            if (status === "done") {
                resultUrl = result_url ?? result;

                if (!resultUrl) {
                    logger.error("❌ [STEP 3] Job is done but no result URL found", {
                        request_id,
                        attempt,
                        full_status_data: statusData,
                    });
                    throw new Error(
                        `Job done but no result URL. Response: ${JSON.stringify(statusData)}`
                    );
                }

                logger.info("✅ [STEP 3] Music generation complete!", {
                    request_id,
                    attempt,
                    result_url: resultUrl,
                    topic_id,
                });
                break;
            }

            if (status === "error") {
                logger.error("❌ [STEP 3] DeAPI reported job failure", {
                    request_id,
                    attempt,
                    full_status_data: statusData,
                });
                throw new Error(
                    `DeAPI job failed. request_id=${request_id}. Response: ${JSON.stringify(statusData)}`
                );
            }

            logger.info(`🔁 [STEP 3] Job still in progress`, {
                request_id,
                attempt,
                status,
                progress: progress ?? "not reported",
                next_poll_in_ms: POLL_INTERVAL_MS,
            });

            if (attempt === MAX_POLL_ATTEMPTS) {
                logger.error("❌ [STEP 3] Polling timed out", {
                    request_id,
                    total_attempts: MAX_POLL_ATTEMPTS,
                    total_time_ms: MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS,
                    last_status: status,
                });
                throw new Error(
                    `Polling timed out after ${MAX_POLL_ATTEMPTS} attempts for request_id=${request_id}`
                );
            }
        }

        // ── 4️⃣  Download the audio binary ────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("⬇️ [STEP 4] Downloading audio binary from result URL", {
            request_id,
            result_url: resultUrl,
            topic_id,
        });

        let audioBuffer;
        try {
            const audioRes = await axios.get(resultUrl, {
                responseType: "arraybuffer",
            });

            audioBuffer = Buffer.from(audioRes.data);

            logger.info("✅ [STEP 4] Audio downloaded successfully", {
                request_id,
                topic_id,
                bytes: audioBuffer.length,
                kb: (audioBuffer.length / 1024).toFixed(2),
                mb: (audioBuffer.length / 1024 / 1024).toFixed(2),
                http_status: audioRes.status,
                content_type: audioRes.headers["content-type"],
            });
        } catch (err) {
            const detail = err.response?.data ?? err.message;
            logger.error("❌ [STEP 4] Failed to download audio", {
                request_id,
                topic_id,
                result_url: resultUrl,
                error_message: err.message,
                http_status: err.response?.status,
                detail,
            });
            throw new Error(`Audio download failed: ${JSON.stringify(detail)}`);
        }

        // ── 5️⃣  Upload to Supabase Storage ───────────────────────────
        const destinationPath = `topics/${topic_id}/background_music.flac`;
        const bucketName = process.env.SUPABASE_BUCKET;

        logger.info("─────────────────────────────────────────────");
        logger.info("☁️ [STEP 5] Uploading audio to Supabase Storage", {
            request_id,
            topic_id,
            bucket: bucketName,
            destination_path: destinationPath,
            file_size_bytes: audioBuffer.length,
        });

        let uploadedPath;
        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(destinationPath, audioBuffer, {
                    contentType: "audio/flac",
                    upsert: true,
                });

            if (uploadError) {
                logger.error("❌ [STEP 5] Supabase upload returned an error", {
                    request_id,
                    topic_id,
                    supabase_error: uploadError,
                });
                throw uploadError;
            }

            if (!uploadData?.path) {
                logger.error("❌ [STEP 5] Supabase upload succeeded but returned no path", {
                    request_id,
                    topic_id,
                    upload_data: uploadData,
                });
                throw new Error("Supabase upload returned no path");
            }

            uploadedPath = uploadData.path;

            logger.info("✅ [STEP 5] Audio uploaded to Supabase Storage", {
                request_id,
                topic_id,
                uploaded_path: uploadedPath,
                bucket: bucketName,
            });
        } catch (err) {
            logger.error("❌ [STEP 5] Supabase storage upload failed", {
                request_id,
                topic_id,
                destination_path: destinationPath,
                error_message: err.message,
            });
            throw new Error(`Supabase upload failed: ${err.message}`);
        }

        // ── 6️⃣  Get public URL ────────────────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("🔗 [STEP 6] Fetching public URL from Supabase", {
            request_id,
            topic_id,
            uploaded_path: uploadedPath,
            bucket: bucketName,
        });

        let publicUrl;
        try {
            const { data: publicData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(uploadedPath);

            if (!publicData?.publicUrl) {
                logger.error("❌ [STEP 6] publicUrl missing from Supabase response", {
                    request_id,
                    topic_id,
                    public_data: publicData,
                });
                throw new Error("publicUrl missing from Supabase response");
            }

            publicUrl = publicData.publicUrl;

            logger.info("✅ [STEP 6] Public URL retrieved", {
                request_id,
                topic_id,
                public_url: publicUrl,
            });
        } catch (err) {
            logger.error("❌ [STEP 6] Failed to get public URL from Supabase", {
                request_id,
                topic_id,
                error_message: err.message,
            });
            throw new Error(`Supabase getPublicUrl failed: ${err.message}`);
        }

        // ── 7️⃣  Save URL to database ──────────────────────────────────
        logger.info("─────────────────────────────────────────────");
        logger.info("💾 [STEP 7] Saving public URL to database", {
            request_id,
            topic_id,
            public_url: publicUrl,
            table: "topics",
            column: "background_music_url",
        });

        try {
            const { error: dbError } = await supabase
                .from("topics")
                .update({ background_music_url: publicUrl })
                .eq("id", topic_id);

            if (dbError) {
                logger.error("❌ [STEP 7] Supabase DB update returned an error", {
                    request_id,
                    topic_id,
                    supabase_db_error: dbError,
                });
                throw dbError;
            }

            logger.info("✅ [STEP 7] Topic updated in database", {
                request_id,
                topic_id,
                background_music_url: publicUrl,
            });
        } catch (err) {
            logger.error("❌ [STEP 7] Database update failed", {
                request_id,
                topic_id,
                error_message: err.message,
            });
            throw new Error(`DB update failed for topic ${topic_id}: ${err.message}`);
        }

        // ── ✅  Done ───────────────────────────────────────────────────
        logger.info("═══════════════════════════════════════════════");
        logger.info("🎉 [DONE] GenerateTopicBackgroundMusic completed successfully", {
            topic_id,
            request_id,
            model_slug: modelSlug,
            background_music_url: publicUrl,
        });
        logger.info("═══════════════════════════════════════════════");

        return {
            success: true,
            topic_id,
            request_id,
            model_slug: modelSlug,
            background_music_url: publicUrl,
        };
    },
});