import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { getSessionCookie } from "../../../../lib/auth";
import axios from "axios";

export async function POST(request) {
  try {
    const userId = await getSessionCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cloneId, text } = body;

    // 1. Fetch the clone record from Supabase
    const { data: clone } = await supabase
      .from("voice_clones")
      .select("voice_id, clone_status")
      .eq("id", cloneId)
      .eq("user_id", userId)
      .single();

    if (!clone || clone.clone_status !== "completed") {
      return NextResponse.json({ error: "Voice clone not ready" }, { status: 400 });
    }

    // 2. Call Modal
    const modalUrl = "https://me-chimaobi--pocket-tts-service-voicetts-tts-clone.modal.run";

    const modalResponse = await axios.post(
      modalUrl,
      {
        voice_id: clone.voice_id, // Ensure this matches the filename in /voices/
        text: text.trim(),
      },
      { 
        responseType: "arraybuffer", // Crucial: Treat response as binary data
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    // 3. Convert ArrayBuffer to Buffer for Supabase Upload
    const audioBuffer = Buffer.from(modalResponse.data);
    const fileName = `${Date.now()}.wav`;
    const filePath = `generated_speech/${cloneId}/${fileName}`;

    // 4. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(filePath, audioBuffer, {
        contentType: "audio/wav",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 5. Return Public URL
    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      audioUrl: urlData.publicUrl,
    });

  } catch (err) {
    console.error("Generate speech error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}