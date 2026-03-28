// import { task, logger } from "@trigger.dev/sdk/v3";
// import OpenAI from "openai";
// import { supabase } from "../lib/supabase";

// type GenerateScriptPayload = {
//   storyId: string;
// };

// export const generateScriptTask = task({
//   id: "generate-script",
//   run: async (payload: GenerateScriptPayload) => {
//     const { storyId } = payload;

//     logger.info("📝 Generating script...", { storyId });

//     const client = new OpenAI({
//       baseURL: process.env.BASE_TEN_BASE_URL,
//       apiKey: process.env.BASE_TEN_API_KEY,
//     });

//     // ✅ Fetch story
//     const { data: story, error: fetchError } = await supabase
//       .from("stories")
//       .select("content, title")
//       .eq("id", storyId)
//       .single();

//     if (fetchError) {
//       logger.error("❌ Failed to fetch story", { error: fetchError });
//       throw fetchError;
//     }

//     if (!story) {
//       throw new Error("Story not found");
//     }

//     logger.info("📖 Story fetched", { title: story.title });

//     // ✅ AI Generates Scenes in NEW STRUCTURE
//     const response = await client.chat.completions.create({
//       model: "deepseek-ai/DeepSeek-V3.1",
//       response_format: { type: "json_object" },
//       messages: [
//         {
//           role: "system",
//           content: `
// You are a professional YouTube script writer for a faceless cinematic channel.

// Convert the provided story into a complete structured video script.

// You must:
// - Decide the number of scenes yourself.
// - Structure pacing for a 15–20 minute engaging video.
// - Create emotional flow (hook → build → climax → resolution → engagement).
// - Ensure the total narration length fits 15–20 minutes.
// - For EACH scene, decide numberOfImages dynamically.
// - image_setup array length MUST equal numberOfImages.
// - imageDuration MUST be an integer (seconds).
// - Each image object MUST include:
//   - imageDuration (integer)
//   - aiImagePrompts (string)
//   - visualDescription (string)
//   - transition_type (string)

// Return ONLY valid JSON.
// Do NOT wrap in markdown.
// Do NOT include backticks.
// Do NOT include explanations.


// The JSON must follow this EXACT structure:

// {
//   "scenes": [
//     {
//       "sceneNumber": number,
//       "title": string,
//       "duration": number,
//       "voiceText": string,
//       "numberOfImages": number,
//       "image_setup": [
//         {
//           "imageDuration": number,
//           "aiImagePrompts": string,
//           "visualDescription": string,
//           "transition_type": string
//         }
//       ]
//     }
//   ]
// }

// Rules:
// - if the original story was broken down into points, the voiceText should contain all text in the point.
// - duration must be realistic in seconds.
// - numberOfImages must match image_setup length exactly.
// - imageDuration values should logically add up close to scene duration.
// - aiImagePrompts must be cinematic and detailed.
// - transition_type can be: "cut", "fade", "crossfade", "fade_to_black".
// - Use powerful emotional storytelling.
// - aiImagePrompts must be very descriptive for the section of the image it is for.
//           `,
//         },
//         {
//           role: "user",
//           content: `
// Story Title:
// ${story.title}

// Story Content:
// ${story.content}
//           `,
//         },
//       ],
//     });

//     let script;

//     try {
//       logger.log("RESPONSE GOTTEN!!!")
//       logger.log(JSON.stringify(response.choices[0].message.content))
//       script = JSON.parse(response.choices[0].message.content || "{}");
//     } catch (err) {
//       logger.error("❌ Failed to parse AI response", { err });
//       throw new Error("Invalid JSON returned from AI");
//     }

//     logger.info("📜 Script generated");

//     // ✅ Optional Safety Validation
//     if (!script.scenes || !Array.isArray(script.scenes)) {
//       throw new Error("Invalid script structure: scenes missing");
//     }

//     for (const scene of script.scenes) {
//       if (
//         scene.numberOfImages !== scene.image_setup?.length
//       ) {
//         throw new Error(
//           `Mismatch in scene ${scene.sceneNumber}: numberOfImages does not match image_setup length`
//         );
//       }
//     }

//     // ✅ Save script
//     const { error } = await supabase
//       .from("stories")
//       .update({
//         script_generated: true,
//         generated_script: JSON.stringify(script),
//       })
//       .eq("id", storyId);

//     if (error) {
//       console.error("Generate script error:", error);
//       throw new Error("Failed to generate script");
//     }

//     logger.info("✅ Script generated and saved", { storyId });

//     return {
//       success: true,
//       message: "Script generated successfully",
//       storyId,
//     };
//   },
// });
