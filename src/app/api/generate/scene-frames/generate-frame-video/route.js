import { NextResponse } from "next/server";
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
        const { storyId, sceneNumber, videoGenUrl } = body;

        if (!storyId || sceneNumber === undefined) {
            return NextResponse.json(
                { error: "Story ID and Scene Number are required" },
                { status: 400 }
            );
        }

        const handle = await tasks.trigger("generate-script-frames", {
            storyId,
            selected_scene_number: Number(sceneNumber),
            video_service_url:videoGenUrl,
            generation_type:"single"
        });

        return NextResponse.json({
            success: true,
            message: `Scene ${sceneNumber} video generation triggered.`,
            runId: handle.id,
        });
    } catch (err) {
        console.error("POST /api/generate/scene-frames/generate-frame-video error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
