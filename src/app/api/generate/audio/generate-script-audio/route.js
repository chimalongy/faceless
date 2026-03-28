import { NextResponse } from "next/server";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../../../lib/auth";

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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storyId, audio_generation_link, generation_mode, voice_id} = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Validate inputs
    if (generation_mode === "clone" && !voice_id) {
      return NextResponse.json(
        { error: "voice_id is required for clone mode" },
        { status: 400 }
      );
    }

    if ((!generation_mode || generation_mode === "link") && !audio_generation_link) {
      return NextResponse.json(
        { error: "audio_generation_link is required for link mode" },
        { status: 400 }
      );
    }

    // 🔥 Trigger background task
    const handle = await tasks.trigger("generate-scene-audio", {
      storyId,
      audio_generation_link,
      generation_mode,
      voice_id,
    });

    return NextResponse.json({
      success: true,
      message: "Scene audio generation started",
      runId: handle.id,
    });

  } catch (error) {
    console.error("Generate scene audio route error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
