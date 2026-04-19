import { NextResponse } from "next/server";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";

// Configure Trigger
if (process.env.TRIGGER_SECRET_KEY) {
  configure({
    secretKey: process.env.TRIGGER_SECRET_KEY,
  });
}

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

    // 1. Fetch story and channel details to check for YouTube auth
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("channel_id, channels(configurations)")
      .eq("id", storyId)
      .eq("user_id", userId)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // 2. Extract configurations
    const channelConfig = JSON.parse(story.channels?.configurations || "{}");
    const ytConfig = channelConfig.youtube;

    if (!ytConfig?.YT_CLIENT_ID || !ytConfig?.YT_CLIENT_SECRET) {
      return NextResponse.json({ error: "YouTube credentials not fully configured in channel settings." }, { status: 400 });
    }

    // 3. If refresh token is missing, ask client to authenticate
    if (!ytConfig?.YT_REFRESH_TOKEN) {
      return NextResponse.json({
        requiresAuth: true,
        authUrl: `/api/youtube/auth?channelId=${story.channel_id}`
      });
    }

    // Trigger the background task — returns immediately
    const handle = await tasks.trigger("upload-story-to-youtube", {
      storyId,
      userId,
    });

    console.log("🎥 YouTube upload task triggered:", handle.id);

    return NextResponse.json({
      success: true,
      message: "YouTube upload task started in background",
      runId: handle.id,
    });
  } catch (err) {
    console.error("❌ YouTube upload route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
