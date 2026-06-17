import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";
import { downloadandUploadImageToSupabase } from "../../../../../lib/tasks/imagedownloader";
import { tasks } from "@trigger.dev/sdk/v3";
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

    const { storyId } = await request.json();

    console.log("storyId", storyId)

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


    // Set generating status to true in database
    await supabase
      .from("stories")
      .update({ is_image_generating: true })
      .eq("id", storyId)
      .eq("user_id", userId);

    const handle = await tasks.trigger("generate-images", {
      storyId
    });





    return NextResponse.json(
      {
        message: "Images are generating",
        storyId,
        generatedImages: []
      },
      { status: 200 },
    );




  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}



