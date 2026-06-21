import { llmGetSlideConfiguration } from "../apis/LLM-central.js";

// ── Valid value sets (used for output validation only) ─────────────────────────
const REMOTION_TRANSITIONS = [
  "fade", "crossfade", "slide-left", "slide-right", "slide-up", "slide-down",
  "zoom", "wipe", "fade-to-black", "fade-to-white",
];

const KEN_BURNS_DIRECTIONS = [
  "zoom-in", "zoom-out", "pan-left", "pan-right", "pan-up", "pan-down",
  "up-left", "up-right", "down-left", "down-right",
];

/**
 * Calls the LLM (via LLM-central) to generate a slide configuration for a scene,
 * then validates and clamps the output values before returning.
 *
 * @param {object} payload  — same payload shape passed into getScriptVideo task
 * @returns {{ slides: object[], audioUrl: string, assContent: string, audioDuration: number }}
 */
export async function getSlideConfiguration(payload) {
  const parsed = await llmGetSlideConfiguration({
    scene:                payload.scene,
    scene_number:         payload.scene_number,
    scene_images:         payload.scene_images,
    scene_audio_url:      payload.scene_audio_url,
    scene_audio_duration: payload.scene_audio_duration,
    ass_content:          payload.ass_content,
    storyId:              payload.storyId,
  });

  const rawSlides    = Array.isArray(parsed?.slides) ? parsed.slides : [];
  const ass_duration = Number(parsed?.ass_duration ?? 0);

  console.log("[getSlideConfiguration] parsed:", parsed);
  console.log("[getSlideConfiguration] ass_duration:", ass_duration);

  const slides = rawSlides.map((slide) => ({
    ...slide,
    kenBurns: {
      direction: KEN_BURNS_DIRECTIONS.includes(slide.kenBurns?.direction)
        ? slide.kenBurns.direction
        : "zoom-in",
      intensity: Math.max(0.05, Math.min(0.5, slide.kenBurns?.intensity ?? 0.1)),
    },
    transition: REMOTION_TRANSITIONS.includes(slide.transition)
      ? slide.transition
      : "fade",
  }));

  return {
    slides,
    audioUrl:      payload.scene_audio_url,
    assContent:    payload.ass_content,
    audioDuration: ass_duration,
  };
}
