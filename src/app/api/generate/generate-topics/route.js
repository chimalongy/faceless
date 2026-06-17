import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
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
        const { channelId, count } = body;

        if (!channelId) {
            return NextResponse.json(
                { error: "channelId is required" },
                { status: 400 }
            );
        }

        // Clamp count between 1 and 20, default to 5
        const topicCount = Math.min(20, Math.max(1, Number(count) || 5));

        // Fetch channel description from database
        const { data: channel, error: channelError } = await supabase
            .from("channels")
            .select("description")
            .eq("id", channelId)
            .single();

        if (channelError || !channel) {
            return NextResponse.json(
                { error: "Channel not found" },
                { status: 404 }
            );
        }

        // Trigger the background task
        const handle = await tasks.trigger("generate-channel-topics", {
            userId,
            channelId,
            description: channel.description,
            count: topicCount,
        });

        return NextResponse.json({
            success: true,
            message: `Topic generation started (${topicCount} topics)`,
            runId: handle.id,
        });
    } catch (error) {
        console.error("Generate topics route error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
