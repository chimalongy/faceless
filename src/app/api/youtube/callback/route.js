import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getSessionCookie } from "../../../../lib/auth";
import { supabase } from "../../../../lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "";
    
    // We strictly extract the userId from the state parameter to bypass cross-site cookie drops
    const [channelId, userId] = state.split("|");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing State User" }, { status: 401 });
    }

    if (!code || !channelId) {
      return NextResponse.redirect(new URL("/dashboard?error=Missing+Code+or+State", request.url));
    }

    // Fetch the channel to get credentials
    const { data: channel, error } = await supabase
      .from("channels")
      .select("configurations")
      .eq("id", channelId)
      .eq("user_id", userId)
      .single();

    if (error || !channel) {
      return NextResponse.redirect(new URL("/dashboard?error=Channel+Not+Found", request.url));
    }

    let config = JSON.parse(channel.configurations || "{}");
    const ytConfig = config.youtube;

    if (!ytConfig?.YT_CLIENT_ID || !ytConfig?.YT_CLIENT_SECRET) {
      return NextResponse.redirect(new URL("/dashboard?error=Missing+YouTube+Credentials", request.url));
    }

    const oauth2Client = new google.auth.OAuth2(
      ytConfig.YT_CLIENT_ID,
      ytConfig.YT_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // We strictly need the refresh token. If it's missing, it usually means the user has 
    // authorized before but we lost it. (prompt="consent" in /auth should force it though)
    if (tokens.refresh_token) {
      config.youtube.YT_REFRESH_TOKEN = tokens.refresh_token;

      if (tokens.access_token) {
        config.youtube.YT_ACCESS_TOKEN = tokens.access_token;
      }

      await supabase
        .from("channels")
        .update({ configurations: JSON.stringify(config) })
        .eq("id", channelId)
        .eq("user_id", userId);
    } else {
      console.warn("YouTube Callback didn't return a refresh_token");
      // If we don't have a refresh token, we technically can't do offline uploads safely.
    }

    // Redirect the user back to the channel dashboard or close the page.
    // Ideally redirecting back to the channel view.
    return NextResponse.redirect(new URL(`/dashboard/channels/${channelId}`, request.url));
  } catch (err) {
    console.error("YouTube Callback Error:", err);
    return NextResponse.redirect(new URL("/dashboard?error=YouTube+Authorization+Failed", request.url));
  }
}
