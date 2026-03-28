import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../lib/auth";

// Avoid crashing the module at import-time if env isn't set (dev safety).
if (process.env.TRIGGER_SECRET_KEY) {
  configure({
    secretKey: process.env.TRIGGER_SECRET_KEY,
  });
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionCookie();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const voiceId = formData.get("voice_id") as string | null;
    const audioFile = formData.get("audio") as File | null;

    if (!voiceId || !audioFile) {
      return NextResponse.json(
        { error: "voice_id and audio are required" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------
       🔍 CHECK DUPLICATE VOICE
    ------------------------------------------------ */
    const { data: existingVoice } = await supabase
      .from("voice_clones")
      .select("id")
      .eq("voice_id", voiceId)
      .maybeSingle();

    if (existingVoice) {
      return NextResponse.json(
        { error: "Voice ID already exists" },
        { status: 409 }
      );
    }

    /* ------------------------------------------------
       📤 UPLOAD AUDIO TO SUPABASE STORAGE
    ------------------------------------------------ */
    const fileExt = audioFile.name.split(".").pop();
    const storagePath = `upload/audio/voice-clones/${userId}/${Date.now()}_${voiceId}.${fileExt}`;

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: audioFile.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    /* ------------------------------------------------
       🔗 GET PUBLIC URL
    ------------------------------------------------ */
    const { data: publicData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(storagePath);

    const audioUrl = publicData.publicUrl;

    /* ------------------------------------------------
       💾 SAVE RECORD TO DATABASE
    ------------------------------------------------ */
    const { data: voiceClone, error: dbError } = await supabase
      .from("voice_clones")
      .insert({
        user_id: userId,
        voice_id: voiceId,
        audio_url: audioUrl,
        storage_path: storagePath,
        clone_status: "pending",
      })
      .select()
      .single();

    if (dbError) throw dbError;

    /* ------------------------------------------------
       🚀 TRIGGER BACKGROUND TASK
    ------------------------------------------------ */
    const handle = await tasks.trigger("voice-clone-task", {
      userId,
      voiceId,
      audioUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Voice cloning job started",
      data: {
        id: voiceClone.id,
        voice_id: voiceId,
        audio_url: audioUrl,
        storage_path: storagePath,
        runId: handle.id,
      },
    });
  } catch (error) {
    console.error("Voice clone route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
