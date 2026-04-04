import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getSessionCookie } from '../../../../../lib/auth';
import { supabase } from '../../../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const channelId = searchParams.get('state'); // State was used for channelId

  if (!code || !channelId) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const userId = await getSessionCookie();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Fetch channel config to get client credentials
  const { data: channel, error } = await supabase
    .from('channels')
    .select('*, user_id')
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
    return NextResponse.json({ error: 'Credentials not found in channel config' }, { status: 400 });
  }

  // 2. Initialize OAuth2 client
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/youtube/callback`;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  // 3. Exchange code for tokens
  let tokens;
  try {
    const { tokens: resTokens } = await oauth2Client.getToken(code);
    tokens = resTokens;
  } catch (err) {
    console.error('Failed to get tokens:', err);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }

  // 4. Extract refresh_token and save to config
  if (!tokens.refresh_token) {
    // If not getting refresh_token, it means the user was already authorized
    // and we didn't specify prompt: 'consent' (which we did, but let's be careful).
    console.warn('Did not receive refresh_token. This might happen if the user was already authorized.');
  }

  const updatedConfig = {
    ...config,
    youtube: {
      ...config.youtube,
      YT_REFRESH_TOKEN: tokens.refresh_token || config.youtube?.YT_REFRESH_TOKEN,
      YT_ACCESS_TOKEN: tokens.access_token, // Access token is for temporary use but good to have
      token_received_at: new Date().toISOString(),
    }
  };

  const { error: updateError } = await supabase
    .from('channels')
    .update({ configurations: JSON.stringify(updatedConfig) })
    .eq('id', channelId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update config with tokens:', updateError);
    return NextResponse.json({ error: 'Failed to save tokens to channel configuration' }, { status: 500 });
  }

  // 5. Redirect back to configuration page with success flag
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/channels/${channelId}/v1/configure?success=true`);
}
