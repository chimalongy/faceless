import { NextResponse } from "next/server";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../../../lib/auth";

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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      storyId,
      sceneNumber, // optional
    } = await request.json();

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // 🔥 Trigger task
    const handle = await tasks.trigger("generate-scene-audio", {
      storyId,
      sceneNumber, // if undefined → generate all scenes
    });

    return NextResponse.json({
      success: true,
      message: sceneNumber
        ? `Scene ${sceneNumber} generation started`
        : "All scenes generation started",
      runId: handle.id,
    });

  } catch (error) {
    console.error("Scene audio route error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
