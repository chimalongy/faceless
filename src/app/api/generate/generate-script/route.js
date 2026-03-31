import { NextResponse } from "next/server";
import { tasks, configure } from "@trigger.dev/sdk/v3";

// Configure Trigger.dev
if (process.env.TRIGGER_SECRET_KEY) {
  configure({
    secretKey: process.env.TRIGGER_SECRET_KEY,
  });
}

export async function POST(request) {
  try {
    // const userId = await getSessionCookie();

    // if (!userId) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Trigger the background task
    const handle = await tasks.trigger("generate-script", {
      storyId,
    });

    return NextResponse.json({
      success: true,
      message: "Script generation started for this story",
      runId: handle.id,
    });
  } catch (error) {
    console.error("Generate frames route error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}