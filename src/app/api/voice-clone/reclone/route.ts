import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../../lib/auth";

if (process.env.TRIGGER_SECRET_KEY) {
  configure({
    secretKey: process.env.TRIGGER_SECRET_KEY,
  });
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cloneId } = (await request.json()) as { cloneId?: string };
    if (!cloneId) {
      return NextResponse.json({ error: "cloneId is required" }, { status: 400 });
    }

    const { data: clone, error: cloneError } = await supabase
      .from("voice_clones")
      .select("id, user_id, voice_id, audio_url, clone_status")
      .eq("id", cloneId)
      .eq("user_id", userId)
      .single();

    if (cloneError || !clone) {
      return NextResponse.json({ error: "Voice clone not found" }, { status: 404 });
    }

    if (!clone.audio_url) {
      return NextResponse.json(
        { error: "No audio sample is stored for this clone" },
        { status: 400 }
      );
    }

    // Ensure status is pending while recloning
    await supabase
      .from("voice_clones")
      .update({ clone_status: "pending" })
      .eq("id", cloneId)
      .eq("user_id", userId);

    // Re-trigger background task
    const handle = await tasks.trigger("voice-clone-task", {
      userId,
      voiceId: clone.voice_id,
      audioUrl: clone.audio_url,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Reclone job queued",
        data: { runId: handle.id },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reclone route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


