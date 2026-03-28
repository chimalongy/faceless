import { logger, task } from "@trigger.dev/sdk/v3";
import { supabase } from "../lib/supabase";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

type SceneImages = {
  image_url: string;
  scene_number: number;
  image_number: number;
  imageDuration: number; // milliseconds
  aiImagePrompts: string;
  visualDescription: string;
  transition_type: string;
};

type FrameGenPayload = {
  storyId: string;
  sceneId: string;
  scene_images: SceneImages[];
  scene_audio_url: string;
  upload_destination: string;
};

const bucketName = process.env.SUPABASE_BUCKET;

export const frameGenTask = task({
  id: "frame-gen",
  maxDuration: 3000,

  run: async (payload: FrameGenPayload, { ctx }) => {
    logger.log("frame-gen payload", { payload, ctx });

    const {
      storyId,
      sceneId,
      scene_images,
      scene_audio_url,
      upload_destination,
    } = payload;

    const tmpDir = path.join(os.tmpdir(), "trigger-frame-gen");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const audioPath = path.join(tmpDir, `${sceneId}-audio.wav`);
    const concatFilePath = path.join(tmpDir, `${sceneId}-concat.txt`);
    const mergedVideoPath = path.join(tmpDir, `${sceneId}-merged.mp4`);
    const finalOutputPath = path.join(tmpDir, `${sceneId}-final.mp4`);

    const imagePaths: string[] = [];
    const videoClipPaths: string[] = [];

    try {
      // -----------------------------
      // 1️⃣ Download images
      // -----------------------------
      for (const img of scene_images) {
        const imgPath = path.join(
          tmpDir,
          `${sceneId}-image-${img.image_number}.jpg`
        );

        const imgResp = await axios.get(img.image_url, {
          responseType: "arraybuffer",
        });

        fs.writeFileSync(imgPath, imgResp.data);
        imagePaths.push(imgPath);
      }

      // -----------------------------
      // 2️⃣ Download audio
      // -----------------------------
      const audioResp = await axios.get(scene_audio_url, {
        responseType: "arraybuffer",
      });

      fs.writeFileSync(audioPath, audioResp.data);

      // -----------------------------
      // 3️⃣ Create video clip for each image
      // -----------------------------
      for (let i = 0; i < scene_images.length; i++) {
        const img = scene_images[i];
        const duration = img.imageDuration / 1000; // ms → seconds
        const clipPath = path.join(tmpDir, `${sceneId}-clip-${i}.mp4`);

        logger.log(`Creating clip ${i} (${duration}s)`);

        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(imagePaths[i])
            .inputOptions(["-loop 1"])
            .outputOptions([
              `-t ${duration}`,
              "-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
              "-c:v libx264",
              "-pix_fmt yuv420p",
              "-r 30",
              "-preset fast",
              "-movflags +faststart",
            ])
            .save(clipPath)
            // ✅ FIXED HERE
            .on("end", (_stdout: string, _stderr: string) => resolve())
            .on("error", (err) => {
              logger.error("Clip creation error", { err });
              reject(err);
            });
        });

        videoClipPaths.push(clipPath);
      }

      // -----------------------------
      // 4️⃣ Create concat file
      // -----------------------------
      const concatContent = videoClipPaths
        .map((clip) => `file '${clip.replace(/\\/g, "/")}'`)
        .join("\n");

      fs.writeFileSync(concatFilePath, concatContent);

      // -----------------------------
      // 5️⃣ Concatenate clips (re-encode)
      // -----------------------------
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(concatFilePath)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions([
            "-c:v libx264",
            "-pix_fmt yuv420p",
            "-preset fast",
          ])
          .save(mergedVideoPath)
          // ✅ FIXED HERE
          .on("end", (_stdout: string, _stderr: string) => resolve())
          .on("error", (err) => {
            logger.error("Concat error", { err });
            reject(err);
          });
      });

      // -----------------------------
      // 6️⃣ Add audio
      // -----------------------------
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(mergedVideoPath)
          .input(audioPath)
          .outputOptions([
            "-map 0:v:0",
            "-map 1:a:0",
            "-c:v copy",
            "-c:a aac",
            "-b:a 192k",
            "-shortest",
          ])
          .save(finalOutputPath)
          // ✅ FIXED HERE
          .on("end", (_stdout: string, _stderr: string) => resolve())
          .on("error", (err) => {
            logger.error("Audio merge error", { err });
            reject(err);
          });
      });

      // -----------------------------
      // 7️⃣ Upload to Supabase
      // -----------------------------
      const videoBuffer = fs.readFileSync(finalOutputPath);

      const { error } = await supabase.storage
        .from(bucketName!)
        .upload(upload_destination, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (error) throw error;

      const videoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${upload_destination}`;

      logger.log("Video uploaded successfully", { videoUrl });

      return {
        success: true,
        message: "frame-gen completed",
        storyId,
        sceneId,
        videoUrl,
        error: null,
      };
    } catch (err) {
      logger.error("Frame-gen failed", { err });

      return {
        success: false,
        message: "frame-gen failed",
        storyId,
        sceneId,
        videoUrl: null,
        error: err,
      };
    } finally {
      // -----------------------------
      // Cleanup temp files
      // -----------------------------
      const allFiles = [
        audioPath,
        concatFilePath,
        mergedVideoPath,
        finalOutputPath,
        ...imagePaths,
        ...videoClipPaths,
      ];

      for (const file of allFiles) {
        if (fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch {
            logger.warn(`Failed to delete ${file}`);
          }
        }
      }
    }
  },
});
