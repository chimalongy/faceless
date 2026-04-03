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

    const { topicId } = await request.json();

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch topic details from database
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("background_music_prompt, background_music_duration")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: "Topic not found or prompt missing" },
        { status: 404 }
      );
    }

    const { background_music_prompt, background_music_duration } = topic;

    if (!background_music_prompt) {
      return NextResponse.json(
        { error: "Topic background music prompt is missing" },
        { status: 400 }
      );
    }

    // 2️⃣ Trigger the background task
    const handle = await tasks.trigger("generate-topic-background-music", {
      topic_id: topicId,
      music_prompt: background_music_prompt,
      music_length: background_music_duration || 60, // Default to 60s if not set
    });

    console.log("🎵 Topic background music task triggered:", handle.id);

    return NextResponse.json({
      success: true,
      message: "Topic background music generation started in background",
      runId: handle.id,
    });

  } catch (err) {
    console.error("❌ Topic background music route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
