import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { configureTrigger } from "../../../../lib/triggerConfig";

export async function POST(request) {
  try {
    await configureTrigger();
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