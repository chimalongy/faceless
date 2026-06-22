import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { configureTrigger } from "../../../../lib/triggerConfig";
import { getSessionCookie } from "../../../../lib/auth";

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

        const body = await request.json();
        const { storyId, channelId, topicId, font } = body;

        if (!storyId || !channelId || !topicId) {
            return NextResponse.json(
                { error: "storyId, channelId, and topicId are required" },
                { status: 400 }
            );
        }

        // Trigger the background task
        const handle = await tasks.trigger("generate-story-thumbnail", {
            storyId,
            channelId,
            topicId,
            font
        });

        return NextResponse.json({
            success: true,
            message: "Story thumbnail generation started",
            runId: handle.id,
        });
    } catch (error) {
        console.error("Generate story thumbnail route error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
