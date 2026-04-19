import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getSessionCookie } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";

export async function GET(request) {
  try {
    const userId = await getSessionCookie();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    // Fetch channel configuration
    const { data: channel, error } = await supabase
      .from("channels")
      .select("configurations")
      .eq("id", channelId)
      .eq("user_id", userId)
      .single();

    if (error || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const config = JSON.parse(channel.configurations || "{}");
    const ytConfig = config.youtube;

    if (!ytConfig?.YT_CLIENT_ID || !ytConfig?.YT_CLIENT_SECRET) {
      return NextResponse.json({ error: "YouTube Client ID and Secret are missing from configuration" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      ytConfig.YT_CLIENT_ID,
      ytConfig.YT_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    const scopes = ["https://www.googleapis.com/auth/youtube.upload"];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // Force consent screen to ensure we get a refresh token
      state: `${channelId}|${userId}`, // Pass channelId and userId gracefully
    });

    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("YouTube Auth Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
