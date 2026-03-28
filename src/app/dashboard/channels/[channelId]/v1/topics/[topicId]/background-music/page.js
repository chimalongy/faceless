import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaMusic, FaTrash } from 'react-icons/fa';
import { getSessionCookie } from '../../../../../../../../lib/auth';
import { supabase } from '../../../../../../../../lib/supabase';
import { getTopicBackgroundMusic, deleteBackgroundMusic } from '../../../../../../../../lib/actions';
import BackgroundMusicUploadForm from '../../../../../../../../components/stories/BackgroundMusicUploadForm';
import GenerateMusicButton from '../../../../../../../../components/stories/GenerateMusicButton';

export default async function BackgroundMusicPage({ params }) {
  const userId = await getSessionCookie();
  if (!userId) notFound();

  const { channelId, topicId } = await params;

  // Verify topic belongs to user
  const { data: topic } = await supabase
    .from('topics')
    .select('id, name, channel_id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (!topic) notFound();

  // Get existing background music
  const backgroundMusic = await getTopicBackgroundMusic(topicId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href={`/dashboard/channels/${channelId}/v1/topics/${topicId}`}
        className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-6"
      >
        <FaArrowLeft /> Back to Topic
      </Link>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Background Music
        </h1>
        <p className="text-gray-500 mt-1">
          Upload and manage background music for "{topic.name}". Stories within this topic can use these tracks.
        </p>
      </div>

      {/* Upload Form */}
      <div className="glass-panel p-8 rounded-xl border border-purple-100 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <FaMusic className="text-purple-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload New Music</h2>
              <p className="text-sm text-gray-500">Add background music tracks that can be used by stories in this topic</p>
            </div>
          </div>
          <GenerateMusicButton topicId={topicId} />
        </div>
        <BackgroundMusicUploadForm topicId={topicId} />
      </div>

      {/* Existing Music List */}
      <div className="glass-panel p-8 rounded-xl border border-purple-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
            <FaMusic className="text-purple-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Uploaded Music</h2>
            <p className="text-sm text-gray-500">
              {backgroundMusic.length === 0
                ? 'No background music uploaded yet'
                : `${backgroundMusic.length} track${backgroundMusic.length !== 1 ? 's' : ''} uploaded`}
            </p>
          </div>
        </div>

        {backgroundMusic.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-purple-200 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/30">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <FaMusic className="text-3xl text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Music Yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Upload background music tracks that can be used by all stories in this topic
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {backgroundMusic.map((music) => (
              <div
                key={music.id}
                className="group rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/60 to-pink-50/40 p-5 hover:border-purple-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FaMusic className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          Music Track {music.id.slice(0, 8)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>Volume: {Math.round(music.volume_level * 100)}%</span>
                          <span>•</span>
                          <span>Format: {music.music_format?.toUpperCase() || 'MP3'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-12">
                      <audio
                        controls
                        src={music.music_url}
                        className="w-full max-w-md"
                        preload="metadata"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>

                  <form action={deleteBackgroundMusic} className="flex-shrink-0">
                    <input type="hidden" name="musicId" value={music.id} />
                    <input type="hidden" name="topicId" value={topicId} />
                    <button
                      type="submit"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete music"
                    >
                      <FaTrash />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

