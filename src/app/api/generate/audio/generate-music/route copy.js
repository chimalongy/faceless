import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

export async function POST(request) {
  try {
    console.log("🎵 Music generation route hit");

    const body = await request.json();
    const { song_description, duration } = body;

    if (!song_description || !duration) {
      return NextResponse.json(
        { error: "song_description and duration are required" },
        { status: 400 }
      );
    }

    // ---------------------------
    // Call Modal API (with timeout)
    // ---------------------------

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

    const modalRes = await fetch(
      "https://me-chimaobi--ace-step-music-api-prod.modal.run/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: song_description,
          duration: Number(duration),
          lyrics: "",
          batch_size: 1,
          cfg_strength: 3.0,
          temperature: 1.0,
          seed: -1,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!modalRes.ok) {
      const errorText = await modalRes.text();
      console.error("❌ Modal error:", errorText);
      return NextResponse.json(
        { error: "Music generation failed", details: errorText },
        { status: 500 }
      );
    }

    const data = await modalRes.json();

    if (!data.audio_files || !data.audio_files.length) {
      return NextResponse.json(
        { error: "No audio returned from Modal" },
        { status: 500 }
      );
    }

    // ---------------------------
    // Decode base64 audio
    // ---------------------------

    const base64Audio = data.audio_files[0];
    const buffer = Buffer.from(base64Audio, "base64");

    const filename = `music_${Date.now()}.wav`;
    const filePath = `generated/music/${filename}`;

    const bucket = process.env.SUPABASE_BUCKET;
    if (!bucket) throw new Error("SUPABASE_BUCKET not set");

    // ---------------------------
    // Upload to Supabase Storage
    // ---------------------------

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: "audio/wav",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const audioUrl = publicData.publicUrl;

    // ---------------------------
    // Optional DB insert
    // ---------------------------

    const storyId = "23f00d68-3548-43e0-a9b8-d03644d86414";
    const sceneNumber = 1;

    if (storyId && sceneNumber) {
      const { error: dbError } = await supabase
        .from("story_audio")
        .insert({
          story_id: storyId,
          scene_number: sceneNumber,
          audio_url: audioUrl,
          is_ai_generated: true,
          audio_format: "wav",
        });

      if (dbError) {
        console.warn("⚠️ DB insert failed:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      audioUrl,
    });

  } catch (err) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Music generation timed out" },
        { status: 504 }
      );
    }

    console.error("❌ Music generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
