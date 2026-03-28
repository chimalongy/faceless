// import { logger, task } from "@trigger.dev/sdk/v3";
// import { supabase } from "../lib/supabase";
// import ffmpeg from "fluent-ffmpeg";
// import axios from "axios";
// import fs from "fs";
// import path from "path";
// import os from "os";

// type MergeFramesPayload = {
//   storyId: string;
//   sceneVideos: { scene_number: number; video_url: string }[];
//   upload_destination: string;
// };

// const bucketName = process.env.SUPABASE_BUCKET;

// export const mergeFramesTask = task({
//   id: "merge-frames",
//   maxDuration: 30000,

//   run: async (payload: MergeFramesPayload, { ctx }) => {
//     const { storyId, sceneVideos, upload_destination } = payload;

//     logger.log("merge-frames started", { storyId, sceneVideos, ctx });

//     const tmpDir = path.join(os.tmpdir(), "trigger-merge-frames");
//     fs.mkdirSync(tmpDir, { recursive: true });

//     try {
//       // 1️⃣ Sort scenes by scene_number
//       const sortedScenes = [...sceneVideos].sort(
//         (a, b) => a.scene_number - b.scene_number
//       );

//       // 2️⃣ Download all videos locally
//       const localFiles: string[] = [];

//       for (const scene of sortedScenes) {
//         const filePath = path.join(tmpDir, `scene-${scene.scene_number}.mp4`);

//         const response = await axios.get(scene.video_url, {
//           responseType: "arraybuffer",
//         });

//         fs.writeFileSync(filePath, response.data);
//         localFiles.push(filePath);
//       }

//       // 3️⃣ Generate concat list file
//       const concatFilePath = path.join(tmpDir, "concat.txt");

//       const concatFileContent = localFiles
//         .map((file) => `file '${file.replace(/\\/g, "/")}'`)
//         .join("\n");

//       fs.writeFileSync(concatFilePath, concatFileContent);

//       const outputPath = path.join(tmpDir, "merged.mp4");

//       // 4️⃣ Merge with full re-encode (MAX compatibility)
//       await new Promise<void>((resolve, reject) => {
//         ffmpeg()
//           .input(concatFilePath)
//           .inputOptions(["-f concat", "-safe 0"])
//           .outputOptions([
//             "-c:v libx264",
//             "-preset veryfast",
//             "-pix_fmt yuv420p",
//             "-profile:v high",
//             "-level 4.2",
//             "-movflags +faststart",
//             "-c:a aac",
//             "-b:a 192k",
//           ])
//           .save(outputPath)
//           .on("end", () => resolve())
//           .on("error", (err) => reject(err));
//       });

//       // 5️⃣ Upload merged video to Supabase
//       const mergedBuffer = fs.readFileSync(outputPath);

//       const { error: uploadError } = await supabase.storage
//         .from(bucketName!)
//         .upload(upload_destination, mergedBuffer, {
//           contentType: "video/mp4",
//           upsert: true,
//         });

//       if (uploadError) throw uploadError;

//       // 6️⃣ Get the public URL from Supabase storage
//       const { data: publicUrlData } = supabase.storage
//         .from(bucketName!)
//         .getPublicUrl(upload_destination);

//       const public_url = publicUrlData.publicUrl;
//       const upload_path = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${upload_destination}`;

//       // 7️⃣ Update the story row by id using update (not upsert)
//       const { data: updatedStory, error: updateError } = await supabase
//         .from("stories")
//         .update({
//           upload_path,
//           completion_status: true,
//           public_url,
//         })
//         .eq("id", storyId)
//         .select()
//         .single();

//       if (updateError) throw updateError;

//       logger.log("merge-frames completed", { storyId, public_url, updatedStory });

//       return {
//         success: true,
//         storyId,
//         videoUrl: public_url,
//       };
//     } catch (err) {
//       logger.error("merge-frames failed", { error: err, storyId });

//       return {
//         success: false,
//         storyId,
//         videoUrl: null,
//         error: err,
//       };
//     } finally {
//       fs.rmSync(tmpDir, { recursive: true, force: true });
//     }
//   },
// });