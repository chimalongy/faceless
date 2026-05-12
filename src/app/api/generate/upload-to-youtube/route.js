import { NextResponse } from "next/server";
import { getSessionCookie } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";
import { google } from "googleapis";
import axios from "axios";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pipeline } from "stream/promises";

export async function POST(request) {
  try {
    const userId = await getSessionCookie();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    console.log("🎥 Starting YouTube upload task", { storyId, userId });

    // 1. Fetch story and channel details
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, channels(*)")
      .eq("id", storyId)
      .eq("user_id", userId)
      .single();

    if (storyError || !story) {
      console.error("❌ Story not found", { storyId, error: storyError });
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // 2. Extract configurations
    const channelConfig = JSON.parse(story.channels?.configurations || "{}");
    const ytConfig = channelConfig.youtube;

    if (!ytConfig?.YT_CLIENT_ID || !ytConfig?.YT_CLIENT_SECRET) {
      console.error("❌ YouTube credentials missing", { channelId: story.channel_id });
      return NextResponse.json({ error: "YouTube credentials not fully configured in channel settings." }, { status: 400 });
    }

    // 3. If refresh token is missing, ask client to authenticate
    if (!ytConfig?.YT_REFRESH_TOKEN) {
      return NextResponse.json({
        requiresAuth: true,
        authUrl: `/api/youtube/auth?channelId=${story.channel_id}`
      });
    }

    const videoUrl = story.completd_video_url || story.public_url;
    if (!videoUrl) {
      console.error("❌ Video URL not found for story", { storyId });
      return NextResponse.json({ error: "Video URL not found" }, { status: 400 });
    }

    // 4. Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      ytConfig.YT_CLIENT_ID,
      ytConfig.YT_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: ytConfig.YT_REFRESH_TOKEN,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // 5. Download video from R2/Supabase to local disk to prevent OOM
    console.log("📥 Downloading video to disk...", { videoUrl });
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
    });

    const tmpVideoPath = path.join(os.tmpdir(), `youtube-vid-${storyId}.mp4`);
    await pipeline(response.data, fs.createWriteStream(tmpVideoPath));

    // 6. Upload to YouTube from disk stream
    console.log("🚀 Uploading to YouTube...", { title: story.title });

    try {
      let safeDescription = story.content || `Video generated for ${story.title}`;
      // YouTube disallows < and > in descriptions
      safeDescription = safeDescription.replace(/[<>]/g, "");
      // YouTube description limit is 5000 chars
      if (safeDescription.length > 4900) safeDescription = safeDescription.substring(0, 4900) + "...";

      let safeTitle = story.title || "Generated Video";
      // YouTube title limit is 100 chars
      if (safeTitle.length > 95) safeTitle = safeTitle.substring(0, 95) + "...";

      const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: safeTitle,
            description: safeDescription,
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

      console.log("✅ YouTube upload successful!", {
        videoId: res.data.id,
        link: `https://www.youtube.com/watch?v=${res.data.id}`
      });

      // 7. Upload Custom Thumbnail if available
      if (story.thumbnail_url) {
        try {
          console.log("🖼️ Uploading custom thumbnail...", { thumbnailUrl: story.thumbnail_url });
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
          console.log("✅ Custom thumbnail applied successfully!");
        } catch (thumbError) {
          console.warn("⚠️ Failed to apply custom thumbnail (but video succeeded)", {
            error: thumbError.response?.data || thumbError.message
          });
        }
      }

      return NextResponse.json({
        success: true,
        videoId: res.data.id,
        link: `https://www.youtube.com/watch?v=${res.data.id}`,
      });
    } catch (uploadError) {
      console.error("❌ YouTube upload failed", {
        error: uploadError.response?.data || uploadError.message
      });
      return NextResponse.json({ error: "YouTube upload failed" }, { status: 500 });
    }
  } catch (err) {
    console.error("❌ YouTube upload route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
