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
        const { topicId, channelId, storyCount, socialMediaTarget } = body;

        if (!topicId || !storyCount) {
            return NextResponse.json(
                { error: "topicId and storyCount are required" },
                { status: 400 }
            );
        }

        // Validate story count
        const count = parseInt(storyCount);
        if (isNaN(count) || count < 1 || count > 20) {
            return NextResponse.json(
                { error: "storyCount must be between 1 and 20" },
                { status: 400 }
            );
        }

        // Fetch topic details from database
        const { data: topic, error: topicError } = await supabase
            .from("topics")
            .select("name, description")
            .eq("id", topicId)
            .single();

        if (topicError || !topic) {
            return NextResponse.json(
                { error: "Topic not found" },
                { status: 404 }
            );
        }

        // Trigger the background task
        const handle = await tasks.trigger("generate-stories", {
            userId,
            topicId,
            channelId,
            topicName: topic.name,
            topicDescription: topic.description,
            storyCount: count,
            socialMediaTarget,
        });

        return NextResponse.json({
            success: true,
            message: `Started generating ${count} stories`,
            runId: handle.id,
        });
    } catch (error) {
        console.error("Generate stories route error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
