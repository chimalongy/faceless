import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { getAdminCookie } from '../../../../lib/adminAuth';

// ── All known Trigger.dev tasks in this project ───────────────────────────────
export const TRIGGER_TASKS = [
  { id: 'generate-stories',               name: 'Story Generation',             category: 'Content',    description: 'AI generates stories for a topic using LLM.' },
  { id: 'generated-story-enhancer',       name: 'Story Enhancer',               category: 'Content',    description: 'Rewrites and enhances individual story sections.' },
  { id: 'generate-channel-topics',        name: 'Topic Generation',             category: 'Content',    description: 'AI generates topic ideas for a channel.' },
  { id: 'generate-script',               name: 'Script Generation',            category: 'Script',     description: 'Produces the full cinematic script from a story.' },
  { id: 'generate-point-script',         name: 'Scene Script Generation',      category: 'Script',     description: 'Generates scene-level scripts for each story point.' },
  { id: 'generate-scene-audio',          name: 'Scene Audio (TTS)',            category: 'Audio',      description: 'Converts scene voice text to audio via Kokoro TTS.' },
  { id: 'generate-topic-background-music', name: 'Background Music Gen',       category: 'Audio',      description: 'Creates AI music for a topic via DeAPI txt2music.' },
  { id: 'mix-background-music',          name: 'Music Mixer',                  category: 'Video',      description: 'Mixes background music track into the merged video.' },
  { id: 'generate-scene-image',          name: 'Scene Image Generation',       category: 'Visuals',    description: 'Generates images for each scene via Modal endpoint.' },
  { id: 'generate-story-thumbnail',      name: 'Thumbnail Generation',         category: 'Visuals',    description: 'Creates a thumbnail image for a story via Modal.' },
  { id: 'merge-frames',                  name: 'Scene Video Merger',           category: 'Video',      description: 'Concatenates scene videos into a single MP4 file.' },
  { id: 'publish-to-postershive',        name: 'YouTube Publisher',            category: 'Publishing', description: 'Sends the completed video to PostersHive for YouTube.' },
];

// ── GET — return all tasks with their current enabled state ───────────────────
export async function GET(request) {
  const isAdmin = await getAdminCookie();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch saved states from DB (table may not exist yet — handle gracefully)
  const { data: rows } = await supabase
    .from('trigger_switches')
    .select('task_id, enabled');

  const stateMap = {};
  if (rows) {
    rows.forEach((r) => { stateMap[r.task_id] = r.enabled; });
  }

  // Merge static task list with stored states (default: enabled = true)
  const tasks = TRIGGER_TASKS.map((t) => ({
    ...t,
    enabled: stateMap[t.id] !== undefined ? stateMap[t.id] : true,
  }));

  return NextResponse.json({ tasks });
}

// ── POST — toggle a single task's enabled state ───────────────────────────────
export async function POST(request) {
  const isAdmin = await getAdminCookie();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId, enabled } = await request.json();

  if (!taskId || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'taskId and enabled (boolean) are required.' }, { status: 400 });
  }

  // Upsert into trigger_switches table
  const { error } = await supabase
    .from('trigger_switches')
    .upsert(
      { task_id: taskId, enabled, updated_at: new Date().toISOString() },
      { onConflict: 'task_id' }
    );

  if (error) {
    console.error('trigger_switches upsert error:', error);
    return NextResponse.json({ error: 'Failed to update switch state.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, taskId, enabled });
}
