import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { supabase } from "../../../../../lib/supabase";
import { configureTrigger } from "../../../../../lib/triggerConfig";
import { getSessionCookie } from "../../../../../lib/auth";

export async function POST(request) {
  try {
    await configureTrigger();
    const userId = await getSessionCookie();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Set generating status to true in database
    await supabase
      .from("stories")
      .update({ is_audio_generating: true })
      .eq("id", storyId)
      .eq("user_id", userId);

    // 🔥 Trigger background task
    const handle = await tasks.trigger("generate-scene-audio", {
      storyId,
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
