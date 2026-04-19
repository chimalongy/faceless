import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";
import { google } from "googleapis";
import axios from "axios";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pipeline } from "stream/promises";

type UploadToYoutubePayload = {
  storyId: string;
  userId: string;
};

export const uploadStoryToYoutubeTask = task({
  id: "upload-story-to-youtube",

  run: async (payload: UploadToYoutubePayload) => {
    const { storyId, userId } = payload;

    logger.info("🎥 Starting YouTube upload task", { storyId, userId });

    // 1. Fetch story and channel details
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, channels(*)")
      .eq("id", storyId)
      .eq("user_id", userId)
      .single();

    if (storyError || !story) {
      logger.error("❌ Story not found", { storyId, error: storyError });
      throw new Error(`Story not found: ${storyId}`);
    }

    // 2. Extract configurations
    const channelConfig = JSON.parse(story.channels?.configurations || "{}");
    const ytConfig = channelConfig.youtube;

    if (!ytConfig?.YT_CLIENT_ID || !ytConfig?.YT_CLIENT_SECRET || !ytConfig?.YT_REFRESH_TOKEN) {
      logger.error("❌ YouTube credentials or refresh token missing", { channelId: story.channel_id });
      throw new Error("YouTube credentials not fully configured (missing refresh token)");
    }

    const videoUrl = story.completd_video_url || story.public_url;
    if (!videoUrl) {
      logger.error("❌ Video URL not found for story", { storyId });
      throw new Error("Video URL not found");
    }

    // 3. Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      ytConfig.YT_CLIENT_ID,
      ytConfig.YT_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: ytConfig.YT_REFRESH_TOKEN,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // 4. Download video from R2/Supabase to local disk to prevent OOM
    logger.info("📥 Downloading video to disk...", { videoUrl });
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
    });

    const tmpVideoPath = path.join(os.tmpdir(), `youtube-vid-${storyId}.mp4`);
    await pipeline(response.data, fs.createWriteStream(tmpVideoPath));

    // 5. Upload to YouTube from disk stream
    logger.info("🚀 Uploading to YouTube...", { title: story.title });

    try {
      const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: story.title,
            description: story.content || `Video generated for ${story.title}`,
            tags: ["faceless", "automation", "shorts"],
            categoryId: "22", // People & Blogs
          },
          status: {
            privacyStatus: "private", // Default to private for safety
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: fs.createReadStream(tmpVideoPath),
        },
      });

      logger.info("✅ YouTube upload successful!", { 
        videoId: res.data.id,
        link: `https://www.youtube.com/watch?v=${res.data.id}` 
      });

      // 6. Upload Custom Thumbnail if available
      if (story.thumbnail_url) {
        try {
          logger.info("🖼️ Uploading custom thumbnail...", { thumbnailUrl: story.thumbnail_url });
          const thumbResponse = await axios({
            method: "GET",
            url: story.thumbnail_url,
            responseType: "stream",
          });
          const tmpThumbPath = path.join(os.tmpdir(), `youtube-thumb-${storyId}.jpg`);
          await pipeline(thumbResponse.data, fs.createWriteStream(tmpThumbPath));
          
          await youtube.thumbnails.set({
            videoId: res.data.id,
            media: {
              body: fs.createReadStream(tmpThumbPath),
            },
          });
          logger.info("✅ Custom thumbnail applied successfully!");
        } catch (thumbError: any) {
           logger.warn("⚠️ Failed to apply custom thumbnail (but video succeeded)", { 
             error: thumbError.response?.data || thumbError.message 
           });
        }
      }

      return {
        success: true,
        videoId: res.data.id,
        link: `https://www.youtube.com/watch?v=${res.data.id}`,
      };
    } catch (uploadError: any) {
      logger.error("❌ YouTube upload failed", { 
        error: uploadError.response?.data || uploadError.message 
      });
      throw uploadError;
    }
  },
});
