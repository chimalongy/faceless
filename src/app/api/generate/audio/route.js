import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { Client } from "@gradio/client";
import { downloadAndUploadToSupabase } from "../../../../lib/tasks/audiodownloader";


export async function POST(request) {
  try {
    const { storyId } = await request.json();

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 },
      );
    }

    // Fetch story
    const { data: story, error } = await supabase
      .from("stories")
      .select("id, title, generated_script")
      .eq("id", storyId)
      .single();

    if (error || !story) {
      console.error("Story not found:", error);
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Parse scenes
    let scenes = [];
    try {
      scenes = JSON.parse(story.generated_script)?.scenes || [];
    } catch (err) {
      console.error("JSON parse error:", err);
      return NextResponse.json(
        { error: "Invalid generated_script format" },
        { status: 500 },
      );
    }

    if (!scenes.length) {
      return NextResponse.json(
        { error: "No scenes found" },
        { status: 400 },
      );
    }



 

    const storedAudioUrls = [];

    // Example audio for voice cloning
    const response = await fetch(
      "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
    );
    const exampleAudio = await response.blob();

    // Connect ONCE (performance optimization)
    const client = await Client.connect(
      "https://a079302492ba9e773e.gradio.live",
    );

    const safeTitle = story.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    // Process each scene
    for (const scene of scenes) {
      const sceneNumber = scene.sceneNumber;
      const text = scene.voiceText;

      if (!text) continue;

      const result = await client.predict("/generate_speech", {
        text,
        mode: "Default Voices",
        preset_voice: "alba",
        clone_audio_path: exampleAudio,
      });

      const destinationPath = `generated/audio/${safeTitle}/scenes/${sceneNumber}.wav`;

      const url = await downloadAndUploadToSupabase(
        result.data[0].url,
        destinationPath,
      );
         console.log(url)

         return
      // Save DB record
      const { error: insertError } = await supabase
        .from("story_audio")
        .insert({
          story_id: story.id,
          audio_url: url.url,
          is_ai_generated: true,
          audio_format: "wav",
          scene_number: sceneNumber,
        });

      if (insertError) {
        console.error("DB insert failed:", insertError);
        throw insertError;
      }

      storedAudioUrls.push(url);
    }

    return NextResponse.json(
      {
        message: "Scene audios generated and saved successfully",
        storyId,
        storedAudioUrls,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Scene audio generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
