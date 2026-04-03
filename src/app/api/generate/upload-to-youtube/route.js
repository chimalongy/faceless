import { NextResponse } from "next/server";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../../lib/auth";

// Configure Trigger
if (process.env.TRIGGER_SECRET_KEY) {
  configure({
    secretKey: process.env.TRIGGER_SECRET_KEY,
  });
}

export async function POST(request) {
  try {
    const userId = await getSessionCookie();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Trigger the background task — returns immediately
    const handle = await tasks.trigger("upload-story-to-youtube", {
      storyId,
      userId,
    });

    console.log("🎥 YouTube upload task triggered:", handle.id);

    return NextResponse.json({
      success: true,
      message: "YouTube upload task started in background",
      runId: handle.id,
    });
  } catch (err) {
    console.error("❌ YouTube upload route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
