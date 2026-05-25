import { supabase } from '../../../lib/supabase';
import { getSessionCookie } from '../../../lib/auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/sidebar-data?channelId=xxx
 * Returns the active channel with all its topics and each topic's stories.
 * Used by the sidebar to render the nested channel → topic → story tree.
 */
export async function GET(request) {
  try {
    const userId = await getSessionCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json({ channel: null, topics: [] });
    }

    // Fetch the channel
    const { data: channel } = await supabase
      .from('channels')
      .select('id, name, channel_type')
      .eq('id', channelId)
      .eq('user_id', userId)
      .single();

    if (!channel) {
      return NextResponse.json({ channel: null, topics: [] });
    }

    // Fetch all topics for this channel
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!topics || topics.length === 0) {
      return NextResponse.json({ channel, topics: [] });
    }

    // Fetch all stories for all topics in one query
    const topicIds = topics.map((t) => t.id);
    const { data: stories } = await supabase
      .from('stories')
      .select('id, title, topic_id, script_generated')
      .in('topic_id', topicIds)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Group stories by topic_id
    const storiesByTopic = {};
    (stories || []).forEach((s) => {
      if (!storiesByTopic[s.topic_id]) storiesByTopic[s.topic_id] = [];
      storiesByTopic[s.topic_id].push(s);
    });

    const topicsWithStories = topics.map((t) => ({
      ...t,
      stories: storiesByTopic[t.id] || [],
    }));

    return NextResponse.json({ channel, topics: topicsWithStories });
  } catch (error) {
    console.error('Sidebar data error:', error);
    return NextResponse.json({ error: 'Failed to load sidebar data' }, { status: 500 });
  }
}
