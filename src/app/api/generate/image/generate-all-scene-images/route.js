import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";
import { downloadandUploadImageToSupabase } from "../../../../../lib/tasks/imagedownloader";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../../../lib/auth";
export async function POST(request) {

  // Configure trigger.dev
  if (process.env.TRIGGER_SECRET_KEY) {
    configure({
      secretKey: process.env.TRIGGER_SECRET_KEY,
    });
  }

  try {
    const userId = await getSessionCookie();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { storyId, image_generation_link } = await request.json();

    

    console.log("storyId", storyId)
    console.log("image_generation_link", image_generation_link)

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



