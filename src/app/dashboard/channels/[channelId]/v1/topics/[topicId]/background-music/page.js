import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FaArrowLeft,
  FaMusic,
  FaMagic,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { getSessionCookie } from '../../../../../../../../lib/auth';
import { supabase } from '../../../../../../../../lib/supabase';
import GenerateTopicMusicModal from '../../../../../../../../components/topics/GenerateTopicMusicModal';
import EditMusicPromptForm from '../../../../../../../../components/topics/EditMusicPromptForm';
import MusicVolumeSlider from '../../../../../../../../components/topics/MusicVolumeSlider';

export default async function BackgroundMusicPage({ params }) {
  const userId = await getSessionCookie();
  if (!userId) notFound();

  const { channelId, topicId } = await params;

  // Fetch topic with all music-related fields including volume
  let { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id, name, background_music_url, background_music_prompt, background_music_duration, background_music_volume, channel_id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  // If the query errored (e.g. background_music_volume column not yet migrated),
  // fall back to a query without it so the page still loads
  if (topicError) {
    const fallback = await supabase
      .from('topics')
      .select('id, name, background_music_url, background_music_prompt, background_music_duration, channel_id')
      .eq('id', topicId)
      .eq('user_id', userId)
      .single();
    topic = fallback.data;
    topicError = fallback.error;
  }

  if (!topic) notFound();

  const hasMusic = !!topic.background_music_url;
  const hasPrompt = !!topic.background_music_prompt;

  return (
    <div className="space-y-8 pb-10">

      {/* ── BACK LINK ── */}
      <Link
        href={`/dashboard/channels/${channelId}/v1/topics/${topicId}`}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-stone-400 hover:text-orange-500 transition-colors no-underline group"
      >
        <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:border-orange-200 group-hover:bg-orange-50 transition-all">
          <FaArrowLeft className="text-[10px]" />
        </span>
        Back to Topic
      </Link>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
            Topic · {topic.name}
          </p>
          <h1
            className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Background Music
          </h1>
          <p className="text-[15px] text-stone-400 mt-1 max-w-lg">
            AI-generated background music for this topic. Used across all stories.
          </p>
        </div>

        {hasPrompt && (
          <div className="self-start sm:self-auto flex-shrink-0">
            <GenerateTopicMusicModal topicId={topicId} hasExisting={hasMusic} />
          </div>
        )}
      </div>

      {/* ── VOLUME SLIDER (always visible) ── */}
      <MusicVolumeSlider
        topicId={topicId}
        channelId={channelId}
        currentVolume={topic.background_music_volume ?? 0.2}
      />

      {/* ── EDITABLE PROMPT CARD ── */}
      <EditMusicPromptForm
        topicId={topicId}
        channelId={channelId}
        currentPrompt={topic.background_music_prompt}
        currentDuration={topic.background_music_duration}
      />

      {/* ── MUSIC PLAYER CARD (only if music exists) ── */}
      {hasMusic && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-7 py-5 border-b border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaMusic className="text-emerald-500 text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  className="text-[16px] font-bold text-stone-900 tracking-tight"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Generated Track
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </span>
              </div>
              <p className="text-[13px] text-stone-400 mt-0.5 truncate">
                AI-generated · {topic.background_music_url.split('/').pop()}
              </p>
            </div>

            {hasPrompt && (
              <div className="flex-shrink-0">
                <GenerateTopicMusicModal topicId={topicId} hasExisting={true} />
              </div>
            )}
          </div>

          <div className="px-7 py-7">
            {/* Decorative waveform */}
            <div className="flex items-end gap-0.5 h-10 mb-5 justify-center opacity-25">
              {[3,5,8,12,18,22,28,32,26,20,15,10,7,12,18,25,30,35,28,22,16,12,8,5,3,5,9,14,20,26,32,28,22,17,12,8,6,10,16,22,28,32,26,20,14,9,5,3].map((h, i) => (
                <div
                  key={i}
                  className="bg-emerald-500 rounded-full flex-shrink-0"
                  style={{ width: '3px', height: `${h}px` }}
                />
              ))}
            </div>

            <audio
              controls
              src={topic.background_music_url}
              className="w-full"
              preload="metadata"
              id="topic-bg-music-player"
            >
              Your browser does not support the audio element.
            </audio>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                <FaMagic className="text-[9px]" />
                AI Generated
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-stone-500 bg-stone-50 border border-gray-100 px-2.5 py-1 rounded-full">
                FLAC
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 bg-stone-50 border border-gray-100 px-2.5 py-1 rounded-full">
                Mix volume: {Math.round((topic.background_music_volume ?? 0.2) * 100)}%
              </span>
              <a
                href={topic.background_music_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 bg-stone-50 border border-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors no-underline"
              >
                ↓ Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── EMPTY STATE — prompt set but no music yet ── */}
      {!hasMusic && hasPrompt && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-violet-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-5">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center">
                <FaMusic className="text-violet-400 text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                <FaMagic className="text-white text-[7px]" />
              </div>
            </div>
            <h3
              className="text-[20px] font-extrabold text-stone-900 tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              No music generated yet
            </h3>
            <p className="text-[14px] text-stone-400 max-w-sm leading-relaxed mb-6">
              Click <span className="font-semibold text-stone-600">&quot;Generate with AI&quot;</span> to create
              background music from your prompt. It runs in the background — check back in a few minutes.
            </p>
            <GenerateTopicMusicModal topicId={topicId} hasExisting={false} />
          </div>
        </div>
      )}

      {/* ── HINT — no prompt and no music ── */}
      {!hasMusic && !hasPrompt && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-start gap-4 px-7 py-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <FaExclamationTriangle className="text-amber-500 text-sm" />
            </div>
            <div>
              <h2
                className="text-[16px] font-bold text-stone-900 tracking-tight mb-1"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Add a prompt to get started
              </h2>
              <p className="text-[14px] text-stone-400 leading-relaxed">
                Use the <span className="font-semibold text-stone-600">Edit Prompt</span> card above to describe
                the style and mood of music you want. Once saved, you can generate AI music in one click.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}