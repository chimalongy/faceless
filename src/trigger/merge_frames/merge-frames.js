import { logger, task, usage } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase.js";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

const bucketName = process.env.SUPABASE_BUCKET;

export const mergeFramesTask = task({
  id: "merge-frames",
  maxDuration: 80000,

  run: async (payload, { ctx }) => {
    const { storyId, sceneVideos, upload_destination, video_generation_url } = payload;

    logger.log("merge-frames started", { storyId, sceneVideos, ctx });

    const tmpDir = path.join(os.tmpdir(), "trigger-merge-frames");
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      const sortedScenes = [...sceneVideos].sort(
        (a, b) => a.scene_number - b.scene_number
      );

      // Download all videos locally
      const localFiles = [];

      for (const scene of sortedScenes) {
        const filePath = path.join(tmpDir, `scene-${scene.scene_number}.mp4`);

        logger.log(`Downloading scene ${scene.scene_number}...`);

        const response = await axios.get(scene.video_url, {
          responseType: "arraybuffer",
        });

        fs.writeFileSync(filePath, response.data);
        localFiles.push(filePath);
      }

      // Generate concat list file
      const concatFilePath = path.join(tmpDir, "concat.txt");
      const concatFileContent = localFiles
        .map((file) => `file '${file.replace(/\\/g, "/")}'`)
        .join("\n");
      fs.writeFileSync(concatFilePath, concatFileContent);

      const outputPath = path.join(tmpDir, "merged.mp4");

      logger.log("Starting FFmpeg merge...");

      // Merge with heartbeat via progress events
      await new Promise((resolve, reject) => {
        let lastHeartbeat = Date.now();

        ffmpeg()
          .input(concatFilePath)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions([
            "-c:v libx264",
            "-preset veryfast",
            "-pix_fmt yuv420p",
            "-profile:v high",
            "-level 4.2",
            "-movflags +faststart",
            "-c:a aac",
            "-b:a 192k",
          ])
          .save(outputPath)
          .on("progress", (progress) => {
            const now = Date.now();

            // Log progress every 20s to send heartbeat signal
            if (now - lastHeartbeat >= 20_000) {
              logger.log("FFmpeg encoding progress...", {
                percent: progress.percent,
                timemark: progress.timemark,
              });
              lastHeartbeat = now;
            }
          })
          .on("end", () => {
            logger.log("FFmpeg merge complete");
            resolve();
          })
          .on("error", (err) => reject(err));
      });

      // Upload merged video to Supabase
      logger.log("Uploading merged video...");
      const mergedBuffer = fs.readFileSync(outputPath);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(upload_destination, mergedBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(upload_destination);

      const public_url = publicUrlData.publicUrl;
      const upload_path = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${upload_destination}`;

      // Update the story row
      const { data: updatedStory, error: updateError } = await supabase
        .from("stories")
        .update({
          upload_path: upload_path,
          completion_status: true,
          completd_video_url: public_url,
          public_url: public_url,
        })
        .eq("id", storyId)
        .select()
        .single();

      if (updateError) throw updateError;

      logger.log("merge-frames completed", { storyId, public_url, updatedStory });

      //call the background music inserter task

      return { success: true, storyId, videoUrl: public_url };
    } catch (err) {
      logger.error("merge-frames failed", { error: err, storyId });
      return { success: false, storyId, videoUrl: null, error: err };
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  },
});