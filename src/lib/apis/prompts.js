// ─────────────────────────────────────────────────────────────────────────────
// prompts.js
//
// Central repository for ALL LLM prompt templates used in this project.
// Each exported function accepts the dynamic variables for that prompt and
// returns { systemPrompt, userPrompt } ready to pass to LLM-central.js.
//
// Rule: NO OpenAI / fetch / HTTP calls live here — just strings.
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// 1. Generate Channel Topics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ topicCount: number, topicString: string, description: string }} params
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildGenerateTopicsPrompt({ topicCount, topicString, description }) {
  const systemPrompt = `
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
      "story_thumbnail_prompt": "string",
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
   - The topic itself should serve as a foundation for many stories.
5. The topic must be PUNCHY, compelling, concise, and attention-grabbing. MUST not include COLONS (:).
6. The description must be detailed and explain why this topic is interesting for a channel audience IN LESS THAN 300 WORDS.
7. Generate a structured image_generation_theme for each topic:
   - Ensure visual consistency across all stories for this topic.
   - Include art_style, lighting, color_palette, mood, camera_style, detail_level, and texture.
   - The theme should be vivid and specific enough for AI image generation to follow consistently.
8. DO NOT generate topics that are similar to or overlap IN MEANING OR SEMANTICS with any of these existing topics: ${topicString} SO BE VERY CREATIVE.
9. Generate a background music prompt for each topic:
   - The prompt should be enough for AI music generation to follow consistently and generate an instrumental music with no vocals befitting for stories generated from the topic.
   - The length of the music must be 1 minute.
   - The music should be loopable. (the beginning of the music must be able to align seamlessly with the end of the music)
   - The music must not contain drum beat, piano and JAZZ. BUT NO VOCALS
10. Generate a story thumbnail prompt for each topic:
   - The prompt should be enough for AI image generation to follow consistently and generate similar thumbnails for all the stories within the topic.
   - The thumbnail should be visually appealing and attention-grabbing.
   - The thumbnail should be visually consistent with the image_generation_theme.

Use your max creativity to produce viral, audience-engaging ideas while strictly following the JSON structure above.
`.trim();

  return { systemPrompt, userPrompt: description };
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. Generate a Single Story
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ topicName: string, topicDescription: string, alreadyCreatedTitlesString: string }} params
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildGenerateStoryPrompt({ topicName, topicDescription, alreadyCreatedTitlesString }) {
  const systemPrompt = `
You are a very intelligent and creative AI content writer for faceless YouTube channels. 
When given a topic name, you would generate a content idea from the topic and generate the full content.
Generate ONE viral, highly engaging content (not nessarily a story but in this context called a 'story') that lasts about 20 minutes.
You are to structure the content with a clear introduction followed by several key points of discussion, ensuring that each point logically builds upon the previous one to create a smooth and progressive flow of the overall content idea.

Rules:

1. The content idea must be drawn from the topic.
2. The following is the previous content created from the topic ${alreadyCreatedTitlesString}. DO NOT come up with content/story that relate in meaning, context or sematics with any of those titles
3. Title must be punchy, and MUST NOT include colons (:).
4. a content must:
   - Begin with a clear "introduction" section.
   - Include multiple points as an array under "points".
   - Each point must have:
       - "point_title" relevant to the story title.
       - "story" explaining that point in detail.(this must not neccesarily a story)
   - Use simple, clear language.
   - Be highly engaging and captivating.
   - Be no less than 800 words in total.
4. Focus on ONE central story entity.
5. story_description must be captivating and intriguing short (max 200 words).
6. Align all content closely with the title.
7. Do not wrap JSON in markdown or backticks.
8. Do not include explanations or extra text outside JSON.
9. Return ONLY valid JSON in this exact structure:

{
  "title": "string",
  "story_description": "string"
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
Here is the topic details
Topic details:
topic_name: ${topicName}
topic_description: ${topicDescription}
`.trim();

  const userPrompt = `
topic_name: ${topicName}
topic_description: ${topicDescription}
`.trim();

  return { systemPrompt, userPrompt };
}


// ─────────────────────────────────────────────────────────────────────────────
// 3. Enhance a Story Section
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ story_title: string, story: string, section_title: string, section_content: string }} params
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildEnhanceStorySectionPrompt({ story_title, story, section_title, section_content }) {
  const systemPrompt = `
You are a professional content writer specializing in faceless YouTube channels.
Enhance a section of a content to make it more engaging, and well aligned for what section of the overall content.

Return ONLY valid JSON:

{
  "title": "string",
  "content": "string" //the improved version of the section_content
}

Do not include anything outside JSON. Do not wrap in markdown or code fences.
`.trim();

  const userPrompt = `
story_title: ${story_title}
story: ${story}
section_title: ${section_title}
section_content: ${section_content}
`.trim();

  return { systemPrompt, userPrompt };
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. Enhance a Thumbnail Prompt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ storyTitle: string, storyContent: string, basePrompt: string, imageTheme: string }} params
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildEnhanceThumbnailPrompt({ storyTitle, storyContent, basePrompt, imageTheme }) {
  const systemPrompt = `
You are an expert YouTube thumbnail prompt engineer.

You would be provided with a content tittle, content base prompt for the thumbnail, and image theme.

Your job is to understand the content, and its intent, base prompt, and image theme to generate a new prompt  maintain STRICT visual consistency across all thumbnails base on the theme.

Here is an example of what your improved prompt should look like:

for a story title "THE INVISIBLE HANDSHAKES THAT BUILT FORTUNES":

Epic cinematic YouTube thumbnail of powerful elite businessmen exchanging a secret handshake in a luxurious dark boardroom, ultra realistic, dramatic lighting, stormy city skyline visible through massive glass windows, glowing city lights at night, subtle lightning in the background, atmosphere of secrecy and wealth, billionaire aesthetic, shadowy figures watching in the background, floating embers and dust particles in the air, intense emotional expressions, tailored black suits with gold accents, luxury watches and rings visible, mysterious “old money” atmosphere, cinematic composition, movie poster style, ultra sharp focus, volumetric lighting, depth of field, high contrast, masterpiece, 8k, hyper detailed, trending on ArtStation

Large bold thumbnail text on left side:
"THE INVISIBLE HANDSHAKES THAT BUILT FORTUNES"
with gold, red, and white typography in gritty distressed style.



Style references:
Succession TV series aesthetic, Wall Street billionaire atmosphere, dark cinematic realism, luxury business documentary thumbnail, psychology and power channel branding, dramatic storytelling composition. the text should always be in bright colors to stand out.

IMPORTANT: NO TEXTS SHOULD BE ON THE RIGHT SIDE

Negative prompt:
blurry, low quality, cartoon, distorted face, extra fingers, bad anatomy, watermark, unreadable text, flat lighting, oversaturated, low detail


use the provided topic to generate yours.


Return JSON:
{ "modified_prompt": "string" }
`.trim();

  const userPrompt = `
STORY TITLE: ${storyTitle}
CONTENT: ${storyContent}
BASE PROMPT: ${basePrompt}
THEME: ${imageTheme}
`.trim();

  return { systemPrompt, userPrompt };
}


// ─────────────────────────────────────────────────────────────────────────────
// 5. Generate Point Script (cinematic scenes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ storyTitle: string, section: string, storyContent: string }} params
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildGeneratePointScriptPrompt({ storyTitle, section, storyContent }) {
  const systemPrompt = `
You are a professional storytelling assistant.

You will receive a full story and a specific section to work on.

Your task:
- Break the section into multiple cinematic scenes.
- Decide the number of images per scene.
- Ensure the image_setup length equals numberOfImages.

Return ONLY valid JSON.

Structure:

{
  "scenes": [
    {
      "sceneNumber": number,
      "title": string,
      "duration": number,
      "voiceText": string,
      "numberOfImages": number,
      "image_setup": [
        {
          "imageDuration": number,
          "aiImagePrompts": string,
          "visualDescription": string,
          "transition_type": string
        }
      ]
    }
  ]
}

Rules:
- duration must be in seconds
- imageDuration must be integer
- image_setup length must equal numberOfImages
- transitions allowed: cut, fade, crossfade, fade_to_black
- aiImagePrompts must be cinematic and highly descriptive
- voiceText must be engaging and emotional
- imageDuration values should roughly match scene duration
`.trim();

  const userPrompt = `
Story Title:
${storyTitle}

Section To Expand:
${section}

Full Story Context:
${storyContent}
`.trim();

  return { systemPrompt, userPrompt };
}


// ─────────────────────────────────────────────────────────────────────────────
// 6. Enhance a Scene Image Prompt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ storyContent: string, sceneNumber: number, imageNumber: number, originalPrompt: string, imageGenerationTheme: string }} params
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildEnhanceImagePrompt({ storyContent, sceneNumber, imageNumber, originalPrompt, imageGenerationTheme }) {
  const systemPrompt = `
You are an expert cinematic AI image prompt engineer.

Enhance the prompt visually while keeping its meaning.

Return JSON:

{
  "modified_prompt": "string"
}
`.trim();

  const userPrompt = `
STORY:
${storyContent}

SCENE_NUMBER:
${sceneNumber}

IMAGE_NUMBER:
${imageNumber}

ORIGINAL_PROMPT:
${originalPrompt}

IMAGE_GENERATION_THEME:
${imageGenerationTheme}
`.trim();

  return { systemPrompt, userPrompt };
}


// ─────────────────────────────────────────────────────────────────────────────
// 7. Slide Configuration for video frame rendering
//    Used by: src/lib/utils/getSlideConfiguration.js
// ─────────────────────────────────────────────────────────────────────────────

const REMOTION_TRANSITIONS = [
  "fade", "crossfade", "slide-left", "slide-right", "slide-up", "slide-down",
  "zoom", "wipe", "fade-to-black", "fade-to-white",
];

const KEN_BURNS_DIRECTIONS = [
  "zoom-in", "zoom-out", "pan-left", "pan-right", "pan-up", "pan-down",
  "up-left", "up-right", "down-left", "down-right",
];

/**
 * @param {{ scene: object, scene_number: number, scene_images: object[], scene_audio_url: string, scene_audio_duration: number, ass_content: string }} params
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildSlideConfigurationPrompt({
  scene, scene_number, scene_images, scene_audio_url, scene_audio_duration, ass_content,
}) {
  const systemPrompt = `
You are an expert AI video generator for faceless YouTube content using Remotion.

Task:
- Generate a slide configuration using the provided scene_images and .ass subtitles.
- You must decide the duration of each image based on the time frames in the dialogue lines from the .ass file.
- Use EXACTLY the number of images provided — no more, no less. Do NOT reuse images.
- Duration of any image MUST NEVER BE 0. If a slide would have duration 0, split the remaining duration equally across all slides.
- Assign duration for each image based on the description and time frame of the audio.
- Select the best transition for each slide from ONLY these values:
  ${REMOTION_TRANSITIONS.join(", ")}
- Select the best Ken Burns direction for each slide from ONLY these values:
  ${KEN_BURNS_DIRECTIONS.join(", ")}
- Ken Burns intensity guide:
    0.05 → subtle zoom  (1 → 1.05)
    0.2  → noticeable   (1 → 1.2)
    0.5  → dramatic     (1 → 1.5)
  Use values between 0.05 and 0.5.

Return ONLY a valid JSON object:
{
  "slides": [
    {
      "image": "<image_url>",
      "duration": <number in seconds, never zero>,
      "transition": "<transition>",
      "kenBurns": { "direction": "<direction>", "intensity": <number> }
    }
  ],
  "ass_duration": <total duration in seconds from the ass content>
}
`.trim();

  const userPrompt = `
STORY_TITLE:
${scene?.title ?? ""}

SCENE_NUMBER:
${scene_number}

SCENE_IMAGES:
${JSON.stringify(scene_images, null, 2)}

IMAGE_SETUP:
${JSON.stringify(scene?.image_setup ?? [], null, 2)}

AUDIO_URL:
${scene_audio_url}

AUDIO_DURATION:
${scene_audio_duration}

AUDIO_ASS_CONTENT:
${ass_content}
`.trim();

  return { systemPrompt, userPrompt };
}
