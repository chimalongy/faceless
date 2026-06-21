import OpenAI from "openai";
import {
    buildGenerateTopicsPrompt,
    buildGenerateStoryPrompt,
    buildEnhanceStorySectionPrompt,
    buildEnhanceThumbnailPrompt,
    buildGeneratePointScriptPrompt,
    buildEnhanceImagePrompt,
    buildSlideConfigurationPrompt,
} from "./prompts.js";
import { getLLMAPIs } from "./getapis.js";
import { supabase } from "../supabase.js";
import { logger } from "@trigger.dev/sdk/v3";

// ─────────────────────────────────────────────────────────────────────────────
// LLM-central.js
//
// THE single source of truth for all LLM API calls in this project.
// Every trigger task that needs an LLM response must import a function from
// here. No other file should instantiate an OpenAI client or call
// client.chat.completions.create directly.
//
// Prompts live in: src/lib/apis/prompts.js
// Model:           deepseek-ai/DeepSeek-V3.1  via Base Ten (OpenAI-compatible)
// ─────────────────────────────────────────────────────────────────────────────

//const DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3.1";
const DEFAULT_MODEL = "moonshotai/Kimi-K2.6";





/**
 * Creates a fresh OpenAI client pointed at the Base Ten endpoint.
 * Called internally — env vars are resolved at invocation time.
 */
function createClient() {
    return new OpenAI({
        baseURL: process.env.BASE_TEN_BASE_URL,
        apiKey: process.env.BASE_TEN_API_KEY,
    });
}

/**
 * Core LLM gateway — ALL requests funnel through this function.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<object>} Parsed JSON object returned by the model
 */





async function callLLM(systemPrompt, userPrompt, options = {}) {
    const llm_apis = await getLLMAPIs();
    console.log(llm_apis);

    let apisToTry = [];
    if (options.strictCloudflare) {
        apisToTry = llm_apis.filter(api => api.llm_provider === 'cloudfare');
    } else {
        const useGroq = options.storyId ? await checkUserUseGroq(options.storyId) : false;
        if (useGroq) {
            const groqApis = llm_apis.filter(api => api.llm_provider === 'groq');
            const cloudflareApis = llm_apis.filter(api => api.llm_provider === 'cloudfare');
            apisToTry = [...groqApis, ...cloudflareApis];
        } else {
            apisToTry = llm_apis.filter(api => api.llm_provider !== 'groq');
        }
    }

    logger.info(`Total LLM APIs count: ${llm_apis.length}`);
    logger.info(`LLM APIs to try after filtering: ${apisToTry.length}`);

    let lastError = null;

    for (const api of apisToTry) {
        try {
            console.log(`Trying provider: ${api.llm_provider} (id: ${api.id})`);

            if (api.llm_provider === 'baseten') {
                const result = await callBaseten(api, systemPrompt, userPrompt);
                return result;
            } else if (api.llm_provider === 'cloudfare') {
                const result = await callCloudflare(api, systemPrompt, userPrompt);
                return result;
            } else if (api.llm_provider === 'groq') {
                const result = await callGroq(api, systemPrompt, userPrompt);
                return result;
            } else {
                console.warn(`Unknown provider "${api.llm_provider}", skipping.`);
                continue;
            }

        } catch (err) {
            console.error(`Provider ${api.llm_provider} (id: ${api.id}) failed: ${err.message}`);
            lastError = err;
            // continue to next api
        }
    }

    throw new Error(`All LLM APIs failed. Last error: ${lastError?.message}`);
}

async function checkUserUseGroq(storyId) {
    if (!storyId) return false;
    try {
        const { data: storyData, error: storyError } = await supabase
            .from("stories")
            .select("user_id")
            .eq("id", storyId)
            .single();
        if (storyError || !storyData?.user_id) {
            console.error("Error querying user_id for storyId:", storyId, storyError);
            return false;
        }
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("use_groq")
            .eq("id", storyData.user_id)
            .single();
        if (userError) {
            console.error("Error querying use_groq for userId:", storyData.user_id, userError);
            return false;
        }
        return !!userData?.use_groq;
    } catch (err) {
        console.error("Error in checkUserUseGroq:", err);
        return false;
    }
}

async function callGroq(api, systemPrompt, userPrompt) {
    const { OpenAI } = await import("openai");

    let baseURL = api.llm_url || "https://api.groq.com/openai/v1";
    if (baseURL.endsWith("/chat/completions")) {
        baseURL = baseURL.slice(0, -"/chat/completions".length);
    } else if (baseURL.endsWith("/chat/completions/")) {
        baseURL = baseURL.slice(0, -"/chat/completions/".length);
    }

    const client = new OpenAI({
        apiKey: api.llm_api,
        baseURL: baseURL,
    });

    const response = await client.chat.completions.create({
        model: api.model_name || "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
    });

    let raw = response.choices[0]?.message?.content ?? "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(raw);
    } catch {
        throw new Error(`Groq returned invalid JSON:\n${raw}`);
    }
}

async function callBaseten(api, systemPrompt, userPrompt) {
    const { OpenAI } = await import("openai");

    const client = new OpenAI({
        apiKey: api.llm_api,
        baseURL: api.llm_url,
    });

    const response = await client.chat.completions.create({
        model: api.model_name,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });

    let raw = response.choices[0]?.message?.content ?? "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(raw);
    } catch {
        throw new Error(`Baseten returned invalid JSON:\n${raw}`);
    }
}

async function callCloudflare(api, systemPrompt, userPrompt) {
    const response = await fetch(api.llm_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    let raw = data.reply ?? "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(raw);
    } catch {
        throw new Error(`Cloudflare returned invalid JSON:\n${raw}`);
    }
}













//this is currently not used
async function callLLMMODAL(systemPrompt, userPrompt) {
    const response = await fetch(
        "https://confidence-ogbonna2000--example-vllm-inference-serve.modal.run/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemma-4-26B-A4B-it",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],

                temperature: 0.7,
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json(); // <-- THIS was missing

    let raw = data.choices[0]?.message?.content ?? "";

    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(raw);
    } catch {
        throw new Error(`LLM returned invalid JSON:\n${raw}`);
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// 1. Generate Channel Topics
//    Used by: src/trigger/topics/generate-channel-topics.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ description: string, topicCount: number, topicString: string }} params
 * @returns {Promise<{ topics: Array<object> }>}
 */
export async function llmGenerateTopics({ description, topicCount, topicString }) {
    const { systemPrompt, userPrompt } = buildGenerateTopicsPrompt({ description, topicCount, topicString });
    return callLLM(systemPrompt, userPrompt, { strictCloudflare: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Generate a Single Story
//    Used by: src/trigger/story/generate-stories.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ topicName: string, topicDescription: string, alreadyCreatedTitlesString: string, contentTheme?: string, storyTitle?: string, storyPromptDescription?: string }} params
 * @returns {Promise<{ title: string, content: object }>}
 */
export async function llmGenerateStory({ topicName, topicDescription, alreadyCreatedTitlesString, contentTheme, storyTitle, storyPromptDescription }) {
    const { systemPrompt, userPrompt } = buildGenerateStoryPrompt({ topicName, topicDescription, alreadyCreatedTitlesString, contentTheme, storyTitle, storyPromptDescription });
    return callLLM(systemPrompt, userPrompt, { strictCloudflare: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Enhance a Story Section
//    Used by: src/trigger/story/generated-story-enhancer.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ story_title: string, story: string, section_title: string, section_content: string, contentTheme?: string }} params
 * @returns {Promise<{ title: string, content: string }>}
 */
export async function llmEnhanceStorySection({ story_title, story, section_title, section_content, contentTheme }) {
    const { systemPrompt, userPrompt } = buildEnhanceStorySectionPrompt({ story_title, story, section_title, section_content, contentTheme });
    return callLLM(systemPrompt, userPrompt, { strictCloudflare: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Enhance a Thumbnail Prompt
//    Used by: src/trigger/story/generate-story-thumbnail.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ storyTitle: string, storyContent: string, basePrompt: string, imageTheme: string, storyId?: string }} params
 * @returns {Promise<{ modified_prompt: string }>}
 */
export async function llmEnhanceThumbnailPrompt({ storyTitle, storyContent, basePrompt, imageTheme, storyId }) {
    const { systemPrompt, userPrompt } = buildEnhanceThumbnailPrompt({ storyTitle, storyContent, basePrompt, imageTheme });
    return callLLM(systemPrompt, userPrompt, { storyId });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Generate Point Script (cinematic scenes)
//    Used by: src/trigger/scripts/generate-point-script.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ storyTitle: string, section: string, storyContent: string, contentTheme?: string }} params
 * @returns {Promise<{ scenes: Array<object> }>}
 */
export async function llmGeneratePointScript({ storyTitle, section, storyContent, contentTheme }) {
    const { systemPrompt, userPrompt } = buildGeneratePointScriptPrompt({ storyTitle, section, storyContent, contentTheme });
    return callLLM(systemPrompt, userPrompt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Enhance a Scene Image Prompt
//    Used by: src/trigger/imagetriggers/generateSceneImageTask.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ storyContent: string, sceneNumber: number, imageNumber: number, originalPrompt: string, imageGenerationTheme: string, storyId?: string }} params
 * @returns {Promise<{ modified_prompt: string }>}
 */
export async function llmEnhanceImagePrompt({ storyContent, sceneNumber, imageNumber, originalPrompt, imageGenerationTheme, storyId }) {
    const { systemPrompt, userPrompt } = buildEnhanceImagePrompt({ storyContent, sceneNumber, imageNumber, originalPrompt, imageGenerationTheme });
    return callLLM(systemPrompt, userPrompt, { storyId });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Get Slide Configuration
//    Used by: src/lib/utils/getSlideConfiguration.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ scene: object, scene_number: number, scene_images: object[], scene_audio_url: string, scene_audio_duration: number, ass_content: string, storyId?: string }} params
 * @returns {Promise<{ slides: object[], ass_duration: number }>}
 */
export async function llmGetSlideConfiguration({ scene, scene_number, scene_images, scene_audio_url, scene_audio_duration, ass_content, storyId }) {
    const { systemPrompt, userPrompt } = buildSlideConfigurationPrompt({
        scene, scene_number, scene_images, scene_audio_url, scene_audio_duration, ass_content,
    });
    return callLLM(systemPrompt, userPrompt, { storyId });
}
