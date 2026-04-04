import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getSessionCookie } from '../../../../lib/auth';
import { supabase } from '../../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
  }

  const userId = await getSessionCookie();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Fetch channel config to get client credentials
  const { data: channel, error } = await supabase
    .from('channels')
    .select('configurations')
    .eq('id', channelId)
    .eq('user_id', userId)
    .single();

  if (error || !channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  let config = {};
  try {
    config = JSON.parse(channel.configurations || '{}');
  } catch (err) {
    return NextResponse.json({ error: 'Invalid channel configuration' }, { status: 500 });
  }

  const client_id = config.youtube?.YT_CLIENT_ID;
  const client_secret = config.youtube?.YT_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.json({ error: 'YouTube client credentials not configured' }, { status: 400 });
  }

  // 2. Initialize OAuth2 client
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/youtube/callback`;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  // 3. Generate Auth URL
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for refresh_token
    scope: scopes,
    prompt: 'consent', // Ensure we get the refresh_token even if re-authorizing
    state: channelId, // Pass channelId through state
  });

  return NextResponse.redirect(url);
}
