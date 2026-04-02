import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";
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
    let { storyId, videoGenUrl } = body;

    if (videoGenUrl.endsWith("/")){
   videoGenUrl = videoGenUrl+"generate-video"
    }
    else{
       videoGenUrl = videoGenUrl+"/generate-video"
    }

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    // Fetch story from database
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Trigger background task (optional, if needed like your JS example)
    const handle = await tasks.trigger("generate-script-frames", {
            storyId,
            video_service_url:videoGenUrl,
            generation_type:"all"
        });

    return NextResponse.json({
      success: true,
      message: "Scenes Generated!!!",
      runId: handle.id,
    });
  } catch (err) {
    console.error("POST /api error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
