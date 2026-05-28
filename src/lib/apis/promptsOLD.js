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
   - Each story can have sub-sections (e.g., "10 Brutal Stoic Rules That Will Rebuild Your Mind, Body & Heart").
   - The topic itself should serve as a foundation for many such stories.
5. The topic name must be compelling, concise, and attention-grabbing. MUST not include :
6. The description must be detailed, story-driven, and explain why this topic is interesting for a channel audience.
7. Generate a structured image_generation_theme for each topic:
   - Ensure visual consistency across all stories for this topic.
   - Include art_style, lighting, color_palette, mood, camera_style, detail_level, and texture.
   - The theme should be vivid and specific enough for AI image generation to follow consistently.
8. Do NOT generate topics that are similar to or overlap with any of these existing topics: ${topicString}.
9. Generate a background music prompt for each topic:
   - The prompt should be enough for AI music generation to follow consistently and generate an instrumental music with no vocals befitting for stories generated from the topic.
   - The length of the music must be 1 minute.
   - The music should be loopable. (the beginning of the music must be able to align seamlessly with the end of the music)
   - The music must not contain drum beat, piano and any other instruments that you think would be befitting for the story. BUT NO VOCALS
10. Generate a story thumbnail prompt for each topic:
   - The prompt should be enough for AI image generation to follow consistently and generate similar thumbnails for all the stories within the topic.
   - The thumbnail should be visually appealing and attention-grabbing.
   - The thumbnail should be visually consistent with the image_generation_theme.

Use your creativity to produce viral, audience-engaging ideas while strictly following the JSON structure above.
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
You are a creative AI content writer for faceless YouTube channels. Generate ONE viral, highly engaging story that lasts about 20 minutes.

Return ONLY valid JSON in this exact structure:

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

Rules:

1. Title must be unique, catchy, and intriguing short and MUST NOT include :.
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
5. story_description must be captivating and intriguing short (max 200 words).
6. Align all content closely with the title.
7. Do not wrap JSON in markdown or backticks.
8. Do not include explanations or extra text outside JSON.

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
Enhance a section of a story to make it more engaging, vivid, and compelling.

Return ONLY valid JSON:

{
  "title": "string",
  "content": "string"
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
