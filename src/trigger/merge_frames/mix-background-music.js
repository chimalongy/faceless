import { logger, task } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

export const mixBackgroundMusicTask = task({
    id: "mix-background-music",
    maxDuration: 80000,

    run: async (payload, { ctx }) => {
        const { storyId, videoUrl, upload_destination } = payload;

        logger.info("Getting Story");

        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select("topic_id")
            .eq("id", storyId)
            .single();

        if (storyError || !story) {
            throw new Error("Story not found");
        }

        const topicId = story.topic_id;
        logger.info("Getting Topic");

        const { data: topic, error: topicError } = await supabase
            .from("topics")
            .select("background_music_url")
            .eq("id", topicId)
            .single();

        if (topicError || !topic) {
            throw new Error("Topic not found");
        }

        const backgroundMusicUrl = topic.background_music_url;
        logger.info(backgroundMusicUrl);

        if (backgroundMusicUrl == null) {
            logger.log("No background music set for this topic, skipping mix.", { storyId, topicId });
            return { success: true, storyId, videoUrl, skipped: true };
        }

        logger.log("mix-background-music started", { storyId, videoUrl, backgroundMusicUrl });

        const tmpDir = path.join(os.tmpdir(), "trigger-mix-music");
        fs.mkdirSync(tmpDir, { recursive: true });

        try {
            const videoPath = path.join(tmpDir, "merged.mp4");
            logger.log("Downloading merged video...");
            const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(videoPath, videoResponse.data);

            const musicPath = path.join(tmpDir, "music.mp3");
            logger.log("Downloading background music...");
            const musicResponse = await axios.get(backgroundMusicUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(musicPath, musicResponse.data);

            const outputPath = path.join(tmpDir, "final.mp4");

            logger.log("Starting FFmpeg audio mix...");

            await new Promise((resolve, reject) => {
                let lastHeartbeat = Date.now();

                ffmpeg()
                    .input(videoPath)
                    .input(musicPath)
                    .complexFilter([
                        "[1:a]aloop=loop=-1:size=2e+09[looped]",
                        "[0:a][looped]amix=inputs=2:duration=first:weights=1 0.25[aout]",
                    ])
                    .outputOptions([
                        "-map 0:v",
                        "-map [aout]",
                        "-c:v copy",
                        "-c:a aac",
                        "-b:a 192k",
                        "-shortest",
                        "-movflags +faststart",
                    ])
                    .save(outputPath)
                    .on("progress", (progress) => {
                        const now = Date.now();
                        if (now - lastHeartbeat >= 20_000) {
                            logger.log("FFmpeg mix progress...", {
                                percent: progress.percent,
                                timemark: progress.timemark,
                            });
                            lastHeartbeat = now;
                        }
                    })
                    .on("end", () => {
                        logger.log("FFmpeg mix complete");
                        resolve();
                    })
                    .on("error", (err) => reject(err));
            });

            // Upload to Cloudflare R2
            logger.log("Uploading final mixed video to R2...");
            const finalBuffer = fs.readFileSync(outputPath);

            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET,
                Key: upload_destination,
                Body: finalBuffer,
                ContentType: "video/mp4",
            }));

            const public_url = `${process.env.R2_PUBLIC_URL}/${upload_destination}`;

            // Update story row with final mixed video url
            const { data: updatedStory, error: updateError } = await supabase
                .from("stories")
                .update({
                    completd_video_url: public_url,
                    // public_url: public_url,
                })
                .eq("id", storyId)
                .select()
                .single();








            if (updateError) throw updateError;

            logger.log("mix-background-music completed", { storyId, public_url, updatedStory });

            return { success: true, storyId, videoUrl: public_url };
        } catch (err) {
            logger.error("mix-background-music failed", { error: err, storyId });
            return { success: false, storyId, videoUrl: null, error: err };
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    },
});





