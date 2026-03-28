import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";
import { downloadandUploadImageToSupabase } from "../../../../../lib/tasks/imagedownloader";


export async function POST(request) {
  try {
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






    const generatedImages = [];


    if (!image_generation_link) {

      console.log("NO IMAGE GENERATIION LINKS")

      const safeTitle = story.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      console.log("safeTitle", safeTitle)



      // Process each scene
      for (const scene of scenes) {
        const sceneNumber = scene.sceneNumber;
        const imagePrompt = scene.aiImagePrompts;
        console.log("sceneNumber", sceneNumber)
        console.log("imagePrompt", imagePrompt)


        if (!imagePrompt) continue;

        // Generate image for this scene




        const destinationPath = `generated/images/${safeTitle}/scenes/${sceneNumber}.jpg`;

        let scene_image = await downloadandUploadImageToSupabase(sceneNumber, imagePrompt[0], destinationPath)



        console.log("scene_image", scene_image)

        // Save DB record
        const { error: insertError } = await supabase
          .from("story_images")
          .insert({
            story_id: story.id,
            image_url: scene_image.url,
            order_index: sceneNumber,
          });

        if (insertError) {
          console.error("DB insert failed:", insertError);
          throw insertError;
        }

        generatedImages.push({ sceneNumber, imageUrl: scene_image.url });
      }

      return NextResponse.json(
        {
          message: "Images generated successfully",
          storyId,
          generatedImages,
        },
        { status: 200 },
      );
    }
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}



