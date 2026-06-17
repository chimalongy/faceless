import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { getSessionCookie } from "../../../../lib/auth";

export async function GET(request, { params }) {
  try {
    const userId = await getSessionCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storyId } = await params;

    const { data: story, error } = await supabase
      .from("stories")
      .select("*, story_images(*), story_audio(*), story_video_frames(*)")
      .eq("id", storyId)
      .eq("user_id", userId)
      .single();

    if (error || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, story });
  } catch (err) {
    console.error("Fetch story API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
