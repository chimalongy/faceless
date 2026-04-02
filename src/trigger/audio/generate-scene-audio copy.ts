// import { task, logger } from "@trigger.dev/sdk/v3";
// import { supabase } from "../lib/supabase";
// import { Client } from "@gradio/client";
// import axios from "axios";
// import { downloadAndUploadToSupabase } from "../lib/tasks/audiodownloader";

// type GenerateSceneAudioPayload = {
//   storyId: string;
//   sceneNumber?: number; // optional
//   audio_generation_link?: string; 
//   generation_mode?: "clone" | "link";
//   voice_id?: string;
// };

// export const generateSceneAudioTask = task({
//   id: "generate-scene-audio",

//   run: async (payload: GenerateSceneAudioPayload) => {
//     const {
//       storyId,
//       sceneNumber,
//       audio_generation_link,
//       generation_mode,
//       voice_id,
//     } = payload;

//     logger.info("🎙️ Starting scene audio generation", {
//       storyId,
//       sceneNumber: sceneNumber ?? "ALL",
//     });

//     // 🔹 Fetch story
//     const { data: story, error } = await supabase
//       .from("stories")
//       .select("id, title, generated_script")
//       .eq("id", storyId)
//       .single();

//     if (error || !story) {
//       throw new Error("Story not found");
//     }

//     let scenes: any[] = [];

//     try {
//       scenes = JSON.parse(story.generated_script)?.scenes || [];
//     } catch {
//       throw new Error("Invalid generated_script JSON");
//     }

//     if (!scenes.length) {
//       throw new Error("No scenes found");
//     }

//     // 🔹 If specific scene requested → filter
//     const scenesToProcess = sceneNumber
//       ? scenes.filter((s) => s.sceneNumber === sceneNumber)
//       : scenes;

//     if (!scenesToProcess.length) {
//       throw new Error(`Scene ${sceneNumber} not found`);
//     }

//     const safeTitle = story.title
//       .replace(/[^a-z0-9]/gi, "_")
//       .toLowerCase();

//     const storedAudioUrls: string[] = [];

//     let client: any;
//     let exampleAudio: Blob | undefined;

//     if (!generation_mode || generation_mode === "link") {
//       const response = await fetch(
//         "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav"
//       );
//       exampleAudio = await response.blob();
//       client = await Client.connect(audio_generation_link!);
//     }

//     for (const scene of scenesToProcess) {
//       const currentSceneNumber = scene.sceneNumber;

//       if (!scene.voiceText) continue;

//       // 🔹 Skip if already exists
//       const { data: existing } = await supabase
//         .from("story_audio")
//         .select("id")
//         .eq("story_id", storyId)
//         .eq("scene_number", currentSceneNumber)
//         .maybeSingle();

//       if (existing) {
//         logger.info("⏭️ Skipping existing scene", {
//           currentSceneNumber,
//         });
//         continue;
//       }

//       const destinationPath = `generated/audio/${safeTitle}/scenes/${currentSceneNumber}.wav`;

//       let audioUrlResult;

//       if (generation_mode === "clone") {
//         const modalUrl =
//           "https://me-chimaobi--pocket-tts-service-voicetts-tts-clone.modal.run";

//         const modalResponse = await axios.post(
//           modalUrl,
//           {
//             voice_id,
//             text: scene.voiceText.trim(),
//           },
//           {
//             responseType: "arraybuffer",
//           }
//         );

//         const audioBuffer = Buffer.from(modalResponse.data);

//         await supabase.storage
//           .from(process.env.SUPABASE_BUCKET!)
//           .upload(destinationPath, audioBuffer, {
//             contentType: "audio/wav",
//             upsert: false,
//           });

//         const { data: urlData } = supabase.storage
//           .from(process.env.SUPABASE_BUCKET!)
//           .getPublicUrl(destinationPath);

//         audioUrlResult = {
//           success: true,
//           url: urlData.publicUrl,
//         };
//       } else {
//         const result = await client.predict("/generate_speech", {
//           text: scene.voiceText,
//           mode: "Default Voices",
//           preset_voice: "alba",
//           clone_audio_path: exampleAudio,
//         });

//         audioUrlResult = await downloadAndUploadToSupabase(
//           result.data[0].url,
//           destinationPath
//         );
//       }

//       if (!audioUrlResult.success) {
//         throw new Error(`Audio failed for scene ${currentSceneNumber}`);
//       }

//       await supabase.from("story_audio").insert({
//         story_id: story.id,
//         audio_url: audioUrlResult.url,
//         is_ai_generated: true,
//         audio_format: "wav",
//         scene_number: currentSceneNumber,
//       });

//       storedAudioUrls.push(audioUrlResult.url);

//       logger.info("✅ Scene completed", {
//         currentSceneNumber,
//       });
//     }

//     logger.info("🎉 Scene audio generation finished", {
//       totalProcessed: storedAudioUrls.length,
//     });

//     return {
//       success: true,
//       storyId,
//       processedScenes: storedAudioUrls.length,
//       specificScene: sceneNumber ?? null,
//     };
//   },
// });
