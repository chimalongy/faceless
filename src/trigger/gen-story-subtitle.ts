import { task, logger } from "@trigger.dev/sdk/v3";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { supabase } from "../lib/supabase";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

type GenStorySubtitlePayload = {
  storyId: string;
  videoUrl: string;
  assContent: string;
  uploadPath: string; // Supabase storage path to upload final video
};

export const genStorySubtitleTask = task({
  id: "gen-story-subtitle",
  maxDuration: 1800, // 30 minutes

  run: async (payload: GenStorySubtitlePayload) => {
    const { storyId, videoUrl, assContent, uploadPath } = payload;
      const bucketName = process.env.SUPABASE_BUCKET;
    try {
      const tempDir = os.tmpdir();

      const tempVideoPath = path.join(tempDir, `${storyId}.mp4`);
      const assFilePath = path.join(tempDir, `${storyId}.ass`);
      const mergedVideoPath = path.join(tempDir, `${storyId}_final.mp4`);

      // 1️⃣ Download video locally
      logger.log("Downloading video...", { storyId, videoUrl });
      const videoResp = await axios.get(videoUrl, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(tempVideoPath, videoResp.data);

      // 2️⃣ Delete previous video from Supabase storage
     
      logger.log("Deleting previous video from Supabase storage...", {
        storyId,
        uploadPath,
      });
      await supabase.storage.from(bucketName).remove([uploadPath]);

      // 3️⃣ Create subtitle file locally
      logger.log("Creating .ass subtitle file...", { storyId });
      fs.writeFileSync(assFilePath, assContent, { encoding: "utf-8" });

      // 4️⃣ Merge subtitles using ffmpeg (🔥 WINDOWS SAFE)
      logger.log("Merging subtitles with video using ffmpeg...", { storyId });

      // ffmpeg on Windows mis-parses ":" in paths → must escape
      const escapedAssPath = assFilePath
        .replace(/\\/g, "/")
        .replace(":", "\\:");

      const cmd = `ffmpeg -y -i "${tempVideoPath}" -vf "ass='${escapedAssPath}'" -c:a copy "${mergedVideoPath}"`;

      logger.log("Running ffmpeg command", { cmd });

      await execAsync(cmd);

      // 5️⃣ Upload final video to Supabase
      logger.log("Uploading final video to Supabase...", {
        storyId,
        uploadPath,
      });

      const fileData = fs.readFileSync(mergedVideoPath);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(uploadPath, fileData, { upsert: true });

      if (uploadError) throw uploadError;

      // 6️⃣ Cleanup temp files
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(assFilePath);
      fs.unlinkSync(mergedVideoPath);

      logger.log("Subtitles merged and uploaded successfully!", {
        storyId,
        uploadPath,
      });

      return { ok: true };
    } catch (err: any) {
      logger.error("Failed to generate subtitles", {
        storyId,
        error: err,
      });

      return {
        ok: false,
        error: err?.message || "Unknown error",
      };
    }
  },
});
