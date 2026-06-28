// tones.js

export const TONE_CONFIGS = {

  story_teller: {
    tone_description: `
Adopt a STORY TELLER tone throughout. Specifically:
- Open with a scene-setting hook that drops the listener mid-action.
- Use short punchy sentences for tension, longer flowing ones for atmosphere.
- Favour sensory language: what characters see, hear, and feel.
- Build toward each section's climax before transitioning to the next.
- Convert every fact into a story beat — never state a fact plainly.
`.trim(),

    content_structure: `
Structure the content in this exact sequence. Each section becomes a point in the output:

1. HOOK + SCENE-SET (introduction)
   - Drop the listener directly into the most dramatic or intriguing moment.
   - No slow build. Start mid-action or mid-consequence.
   - End with a question or tension that compels listening on.

2. BACKSTORY + STAKES
   - Reveal who is involved and what is at risk.
   - Give just enough history to make the stakes feel real.
   - Plant emotional investment before the events unfold.

3. RISING TENSION (repeat this section for each major story beat)
   - Each point must escalate tension or reveal something new.
   - End each point on an unresolved note to pull the listener forward.
   - Use cliffhanger language at section transitions.

4. CLIMAX / TURNING POINT
   - The single most dramatic or revelatory moment.
   - This is the peak — everything built to this; write it with full intensity.
   - Slow the pacing here: more sensory detail, shorter sentences.

5. FALLOUT / AFTERMATH
   - Show the immediate consequences of the climax.
   - Let the dust settle — describe what changed, what was lost or won.

6. EMOTIONAL CLOSE (conclusion)
   - End with a reflection, a haunting thought, or an open question.
   - Do NOT summarise. Leave an emotional residue, not a recap.
`.trim(),
  },


  teacher: {
    tone_description: `
Adopt a TEACHER tone throughout. Specifically:
- Begin each section by stating what the listener will learn from it.
- Use the pattern: concept → analogy → real-world example.
- Define jargon immediately when introduced, in plain everyday language.
- Summarise each point in one sentence before moving to the next.
- Ask rhetorical questions to prime the listener before answering them.
`.trim(),

    content_structure: `
Structure the content in this exact sequence. Each section becomes a point in the output:

1. LEARNING PROMISE (introduction)
   - Open by telling the listener exactly what they will understand by the end.
   - State why this knowledge matters to them personally.
   - Pose a provocative question that the content will answer.

2. CONTEXT + WHY IT MATTERS
   - Frame the topic: where did it come from, why does it exist?
   - Connect it to something the listener already knows.
   - Make the relevance immediate — not abstract.

3. CORE CONCEPT + ANALOGY + EXAMPLE (repeat for each key lesson)
   - Introduce the concept in one plain sentence.
   - Immediately follow with an analogy that makes it tangible.
   - Anchor it with a specific real-world example the listener can visualise.
   - End with a one-sentence summary of what was just taught.

4. COMMON MISTAKE / MISCONCEPTION
   - Name the most frequent wrong assumption people make about this topic.
   - Explain exactly why it is wrong.
   - Give the correct mental model as a replacement.

5. PRACTICAL APPLICATION
   - Show how to apply what was taught to a real situation.
   - Make this concrete and actionable, not theoretical.
   - Use a before-and-after or step-by-step format.

6. RECAP + CALL TO ACTION (conclusion)
   - Summarise the three most important things learned.
   - Give the listener one specific action to take or thing to try.
   - End with an encouraging, forward-looking statement.
`.trim(),
  },


  narrator: {
    tone_description: `
Adopt a NARRATOR tone throughout. Specifically:
- Lead with the most important fact in every section — no slow warm-up.
- Maintain a calm, authoritative third-person voice throughout.
- Use precise, concrete language; avoid filler, hype, or emotional editorialising.
- Transition between sections with a single clear bridging sentence.
- Let the weight of the facts carry the content — do not embellish.
`.trim(),

    content_structure: `
Structure the content in this exact sequence. Each section becomes a point in the output:

1. LEAD WITH THE VERDICT (introduction)
   - State the central fact, finding, or subject immediately.
   - Do not build up to it — open with it.
   - Follow with a single sentence of scope: what this content covers and why now.

2. BACKGROUND + CONTEXT
   - Provide the historical or situational conditions that explain how we got here.
   - Stick to verified facts and established sequence of events.
   - Keep it brief — only what is needed to understand what follows.

3. FACTS + EVIDENCE (repeat for each major dimension of the topic)
   - Each point covers one distinct angle, facet, or piece of evidence.
   - State the fact, cite or attribute the source where relevant, then briefly explain its significance.
   - No opinion. If something is disputed, note that it is disputed.

4. CONTRASTING PERSPECTIVE
   - Present the strongest counter-argument, opposing view, or alternative interpretation.
   - Give it full fair weight — do not dismiss it.
   - Note where consensus lies, if it exists.

5. BROADER SIGNIFICANCE
   - Step back: what does this mean at a larger scale?
   - Connect to patterns, trends, or implications beyond the immediate subject.
   - Remain measured — avoid overstatement.

6. MEASURED CLOSE (conclusion)
   - End with a final observation grounded in what was covered.
   - No calls to action, no emotional appeals, no cliffhangers.
   - Leave the listener informed, not stirred.
`.trim(),
  },

};

export function getToneOnly(theme) {
  const config = TONE_CONFIGS[theme ?? DEFAULT_TONE] ?? TONE_CONFIGS[DEFAULT_TONE];
  if (theme && !TONE_CONFIGS[theme]) {
    console.warn(`[getToneOnly] Unknown tone "${theme}", falling back to "${DEFAULT_TONE}"`);
  }
  return config.tone_description;
}

export function getThemeToneDescription(theme) {
  const config = TONE_CONFIGS[theme ?? DEFAULT_TONE] ?? TONE_CONFIGS[DEFAULT_TONE];
  if (theme && !TONE_CONFIGS[theme]) {
    console.warn(`[getThemeToneDescription] Unknown tone "${theme}", falling back to "${DEFAULT_TONE}"`);
  }
  return `${config.tone_description}\n\nCONTENT STRUCTURE:\n${config.content_structure}`;
}

// Use this when you need tone and structure separately
export function getToneConfig(theme) {
  return TONE_CONFIGS[theme ?? DEFAULT_TONE] ?? TONE_CONFIGS[DEFAULT_TONE];
}