import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { tasks, configure } from "@trigger.dev/sdk/v3";
import { getSessionCookie } from "../../../../lib/auth";

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
        const { storyId } = body;

        if (!storyId) {
            return NextResponse.json(
                { error: "Story ID is required" },
                { status: 400 }
            );
        }

        // Fetch story to get title for file name
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select("title")
            .eq("id", storyId)
            .single();

        if (storyError || !story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 }
            );
        }

        // Fetch story video frames
        const { data: videoFrames, error: framesError } = await supabase
            .from("story_video_frames")
            .select("scene_number, frame_video_url")
            .eq("story_id", storyId)
            .order("scene_number", { ascending: true });

        if (framesError) {
            console.error("Error fetching video frames:", framesError);
            return NextResponse.json(
                { error: "Failed to fetch video frames" },
                { status: 500 }
            );
        }

        if (!videoFrames || videoFrames.length === 0) {
            return NextResponse.json(
                { error: "No video frames found for this story" },
                { status: 400 }
            );
        }

        const sceneVideos = videoFrames.map((frame) => ({
            scene_number: frame.scene_number,
            video_url: frame.frame_video_url,
        }));

        const safeTitle = story.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        const upload_destination = `stories/${storyId}/${safeTitle}_merged_${Date.now()}.mp4`;

        // Trigger background task
        const handle = await tasks.trigger("merge-frames", {
            storyId,
            sceneVideos,
            upload_destination,
        });

        return NextResponse.json({
            success: true,
            message: "Merging process started!",
            runId: handle.id,
        });
    } catch (err) {
        console.error("POST /api/generate/merge-frames error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
