import { NextResponse } from "next/server";
import { getSessionCookie } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";
import { tasks, configure } from "@trigger.dev/sdk/v3";

// Configure trigger.dev
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

    // Verify story and configurations
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, channels(*)")
      .eq("id", storyId)
      .eq("user_id", userId)
      .single();

    if (storyError || !story) {
      console.error("Story not found:", storyId, storyError);
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const channelConfig = JSON.parse(story.channels?.configurations || "{}");
    const apiKey = channelConfig.postershive?.api_key;

    if (!apiKey) {
      return NextResponse.json(
        { error: "PostersHive API Key is not configured in channel settings." },
        { status: 400 }
      );
    }

    const videoUrl = story.completd_video_url || story.public_url;
    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL not found. Please complete the video generation first." },
        { status: 400 }
      );
    }

    console.log("🚀 Triggering publish-to-postershive task for story:", storyId);

    const handle = await tasks.trigger("publish-to-postershive", {
      storyId,
    });

    return NextResponse.json({
      success: true,
      message: "Publishing task triggered successfully!",
      runId: handle.id,
    });
  } catch (err) {
    console.error("❌ PostersHive publish route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
