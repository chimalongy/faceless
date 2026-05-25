import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaMusic, FaTrash, FaUpload, FaVolumeUp } from 'react-icons/fa';
import { getSessionCookie } from '../../../../../../../../lib/auth';
import { supabase } from '../../../../../../../../lib/supabase';
import { getTopicBackgroundMusic, deleteBackgroundMusic } from '../../../../../../../../lib/actions';
import BackgroundMusicUploadForm from '../../../../../../../../components/stories/BackgroundMusicUploadForm';
import GenerateMusicButton from '../../../../../../../../components/stories/GenerateMusicButton';

export default async function BackgroundMusicPage({ params }) {
  const userId = await getSessionCookie();
  if (!userId) notFound();

  const { channelId, topicId } = await params;

  const { data: topic } = await supabase
    .from('topics')
    .select('id, name, channel_id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (!topic) notFound();

  const backgroundMusic = await getTopicBackgroundMusic(topicId);

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
            Upload and manage background music for this topic. All stories within the topic can use these tracks.
          </p>
        </div>
        <div className="self-start sm:self-auto flex-shrink-0">
          <GenerateMusicButton topicId={topicId} />
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Uploaded Tracks',
            value: backgroundMusic.length,
            icon: <FaMusic className="text-base" />,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-500',
            accent: 'bg-orange-500',
          },
          {
            label: 'Ready to Use',
            value: backgroundMusic.length,
            icon: <FaVolumeUp className="text-base" />,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            accent: 'bg-amber-500',
          },
          {
            label: 'Formats',
            value: backgroundMusic.length > 0
              ? [...new Set(backgroundMusic.map(m => m.music_format || 'mp3'))].length
              : '—',
            icon: <FaUpload className="text-base" />,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            accent: 'bg-emerald-500',
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center ${card.iconColor}`}>
                {card.icon}
              </div>
              <span className={`w-1 h-7 rounded-full ${card.accent} opacity-60`} />
            </div>
            <p className="text-[13px] font-medium text-gray-400 mb-1">{card.label}</p>
            <p
              className="text-[32px] font-extrabold text-stone-900 leading-none tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── UPLOAD CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-7 py-5 border-b border-gray-100">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaUpload className="text-orange-500 text-base" />
          </div>
          <div>
            <h2
              className="text-[17px] font-bold text-stone-900 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Upload New Track
            </h2>
            <p className="text-[13px] text-stone-400 mt-0.5">
              Add music tracks available to all stories in this topic
            </p>
          </div>
        </div>
        <div className="px-7 py-6">
          <BackgroundMusicUploadForm topicId={topicId} />
        </div>
      </div>

      {/* ── TRACK LIST ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaMusic className="text-amber-500 text-base" />
            </div>
            <div>
              <h2
                className="text-[17px] font-bold text-stone-900 tracking-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Uploaded Tracks
              </h2>
              <p className="text-[13px] text-stone-400 mt-0.5">
                {backgroundMusic.length === 0
                  ? 'No tracks uploaded yet'
                  : `${backgroundMusic.length} track${backgroundMusic.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>

          {backgroundMusic.length > 0 && (
            <span className="text-[12px] font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
              {backgroundMusic.length} {backgroundMusic.length === 1 ? 'track' : 'tracks'}
            </span>
          )}
        </div>

        {/* Empty state */}
        {backgroundMusic.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
              <FaMusic className="text-orange-400 text-2xl" />
            </div>
            <h3
              className="text-[18px] font-extrabold text-stone-900 tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              No tracks yet
            </h3>
            <p className="text-[14px] text-stone-400 max-w-xs leading-relaxed">
              Upload background music above — tracks added here will be available to all stories in this topic.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {backgroundMusic.map((music, index) => (
              <div
                key={music.id}
                className="group flex items-start gap-5 px-7 py-5 hover:bg-stone-50/60 transition-colors"
              >
                {/* Track number */}
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[13px] font-bold text-orange-500">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Track info + player */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-bold text-stone-900 leading-tight">
                        Track {music.id.slice(0, 8).toUpperCase()}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                          {music.music_format?.toUpperCase() || 'MP3'}
                        </span>
                        <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          Vol {Math.round(music.volume_level * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <form action={deleteBackgroundMusic} className="flex-shrink-0">
                      <input type="hidden" name="musicId" value={music.id} />
                      <input type="hidden" name="topicId" value={topicId} />
                      <button
                        type="submit"
                        title="Delete track"
                        className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <FaTrash className="text-[12px]" />
                      </button>
                    </form>
                  </div>

                  <audio
                    controls
                    src={music.music_url}
                    className="w-full max-w-lg h-9"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



    </div>
  );
}