import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.BASE_TEN_BASE_URL,
  apiKey: process.env.BASE_TEN_API_KEY,
});

const REMOTION_TRANSITIONS = [
  "fade",
  "crossfade",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "zoom",
  "wipe",
  "fade-to-black",
  "fade-to-white",
];

const KEN_BURNS_DIRECTIONS = [
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
  "pan-up",
  "pan-down",
  "up-left",
  "up-right",
  "down-left",
  "down-right",
];


export async function getSlideConfiguration(payload) {

  const response = await client.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3.1",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are an expert AI video generator for faceless YouTube content using Remotion.

Task:
- Generate a slide configuration using the provided scene_images and .ass subtitles.
- You must decide the duration of each image in the image based on the time frames as in the dialogue lines from the .ass file.
- Use EXACTLY the number of images provided — no more, no less. Do NOT reuse images.
- Duration of any image in the video must NEVER BE 0. instead of a slide to have duration =0, split the duration equally account to the length of the audio from the transcripted ass file
- Basically just assign duration for each imagem based on the desicrription and time frame of the audio.
- Select the best transition for each slide from ONLY these values:
  ${REMOTION_TRANSITIONS.join(", ")}
- Select the best Ken Burns direction for each slide from ONLY these values:
  ${KEN_BURNS_DIRECTIONS.join(", ")}
- Ken Burns intensity guide:
    0.05 → subtle zoom  (1 → 1.05)
    0.2  → noticeable   (1 → 1.2)
    0.5  → dramatic     (1 → 1.5)
  Use values between 0.05 and 0.5.

Return ONLY a valid JSON object with a "slides" key containing an array:
{
  "slides": [
    {
      "image": "<image_url>",
      "duration": <number in seconds and must not be zero>,
      "transition": "<transition>",
      "kenBurns": { "direction": "<direction>", "intensity": <number> }
      
    }
  ],
  "ass_duration":<duration from the ass content you reviewws"
}
`,
      },
      {
        role: "user",
        content: `
STORY_TITLE:
${payload.scene.title}

SCENE_NUMBER:
${payload.scene_number}

SCENE_IMAGES:
${JSON.stringify(payload.scene_images, null, 2)}

IMAGE_SETUP:
${JSON.stringify(payload.scene.image_setup, null, 2)}

AUDIO_URL:
${payload.scene_audio_url}

AUDIO_DURATION:
${payload.scene_audio_duration}

AUDIO_ASS_CONTENT:
${payload.ass_content}
`,
      },
    ],
  });

  let slides = [];
  let ass_duration
  try {
    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    const rawSlides = Array.isArray(parsed.slides) ? parsed.slides : [];
    ass_duration = Number( parsed.ass_duration)
    

   console.log("This is the parsed")
   console.log(parsed)
   console.log(ass_duration)
    slides = rawSlides.map((slide) => ({
      ...slide,
      kenBurns: {
        // Enforce only valid direction strings
        direction: KEN_BURNS_DIRECTIONS.includes(slide.kenBurns?.direction)
          ? slide.kenBurns.direction
          : "zoom-in",
        // Clamp intensity to the instructed range
        intensity: Math.max(0.05, Math.min(0.5, slide.kenBurns?.intensity ?? 0.1)),
      },
      // Enforce only valid transition strings
      transition: REMOTION_TRANSITIONS.includes(slide.transition)
        ? slide.transition
        : "fade",
    }));
  } catch (err) {
    console.warn("Failed to parse JSON from AI:", err);
  }

  return {
    slides,
    audioUrl: payload.scene_audio_url,
    assContent: payload.ass_content,
    audioDuration: ass_duration
  };
}
