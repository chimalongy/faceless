import { logger, task, usage } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase.js";
import { r2 } from "../../lib/r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import { FFMPEG_PATH, FFPROBE_PATH } from "../../lib/utils/ffmpeg-helper.js";

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { mixBackgroundMusicTask } from "./mix-background-music.js";

export const mergeFramesTask = task({
  id: "merge-frames",
  machine: "large-1x",
  maxDuration: 80000,

  run: async (payload, { ctx }) => {
    const { storyId, sceneVideos, upload_destination, videoGenUrl } = payload;

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

      const upscaledPath = path.join(tmpDir, "upscaled.mp4");

      logger.log("Starting FFmpeg upscaling to 1080p...");

      await new Promise((resolve, reject) => {
        let lastHeartbeat = Date.now();

        ffmpeg()
          .input(outputPath)
          .outputOptions([
            "-vf", "scale=1920:1080:flags=lanczos",
            "-c:v", "libx264",
            "-crf", "18",
            "-preset", "slow",
            "-c:a", "copy",
          ])
          .save(upscaledPath)
          .on("progress", (progress) => {
            const now = Date.now();

            // Log progress every 20s to send heartbeat signal
            if (now - lastHeartbeat >= 20_000) {
              logger.log("FFmpeg upscaling progress...", {
                percent: progress.percent,
                timemark: progress.timemark,
              });
              lastHeartbeat = now;
            }
          })
          .on("end", () => {
            logger.log("FFmpeg upscaling complete");
            resolve();
          })
          .on("error", (err) => reject(err));
      });

      // Upload merged video to Cloudflare R2
      logger.log("Uploading merged (upscaled) video to R2...");
      const mergedBuffer = fs.readFileSync(upscaledPath);

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: upload_destination,
          Body: mergedBuffer,
          ContentType: "video/mp4",
        })
      );

      const public_url = `${process.env.R2_PUBLIC_URL}/${upload_destination}`;

      // Update the story row
      const { data: updatedStory, error: updateError } = await supabase
        .from("stories")
        .update({
          upload_path: public_url,
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

      await mixBackgroundMusicTask.triggerAndWait({
        storyId,
        videoUrl: public_url,
        upload_destination,

      });

      // Reset is_merging to false on success
      await supabase
        .from("stories")
        .update({ is_merging: false })
        .eq("id", storyId);

      return { success: true, storyId, videoUrl: public_url };
    } catch (err) {
      logger.error("merge-frames failed", { error: err, storyId });
      // Reset is_merging to false on error
      await supabase
        .from("stories")
        .update({ is_merging: false })
        .eq("id", storyId);
      return { success: false, storyId, videoUrl: null, error: err };
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  },
});