import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaMusic, FaTrash, FaPlay, FaPause, FaUpload } from 'react-icons/fa';
import { getSessionCookie } from '../../../../../../../../../../lib/auth';
import { supabase } from '../../../../../../../../../../lib/supabase';
import { getStoryBackgroundMusic, uploadStoryBackgroundMusic, deleteStoryBackgroundMusic } from '../../../../../../../../../../lib/actions';
import BackgroundMusicUploadForm from '../../../../../../../../../../components/stories/BackgroundMusicUploadForm';

export default async function BackgroundMusicPage({ params }) {
  const userId = await getSessionCookie();
  if (!userId) notFound();

  const { channelId, topicId, storyId } = await params;

  // Verify story belongs to user
  const { data: story } = await supabase
    .from('stories')
    .select('id, title, channel_id, topic_id')
    .eq('id', storyId)
    .eq('user_id', userId)
    .single();

  if (!story) notFound();

  // Get existing background music
  const backgroundMusic = await getStoryBackgroundMusic(storyId);

  // Get script scenes for scene-specific music assignment
  const { data: storyData } = await supabase
    .from('stories')
    .select('generated_script')
    .eq('id', storyId)
    .single();

  let scriptScenes = [];
  try {
    if (storyData?.generated_script) {
      const scriptData = JSON.parse(storyData.generated_script);
      if (scriptData?.scenes && Array.isArray(scriptData.scenes)) {
        scriptScenes = scriptData.scenes;
      }
    }
  } catch (err) {
    // Script parsing failed, continue without scenes
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href={`/dashboard/channels/${channelId}/v1/topics/${topicId}/stories/${storyId}`}
        className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-6"
      >
        <FaArrowLeft /> Back to Story
      </Link>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Story Background Music
        </h1>
        <p className="text-gray-500 mt-1">
          Upload and manage background music for "{story.title}"
        </p>
      </div>

      {/* Upload Form */}
      <div className="glass-panel p-8 rounded-xl border border-purple-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
            <FaUpload className="text-purple-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload New Music</h2>
            <p className="text-sm text-gray-500">Add background music for the entire story or specific scenes</p>
          </div>
        </div>
        <BackgroundMusicUploadForm storyId={storyId} scriptScenes={scriptScenes} />
      </div>

      {/* Existing Music List */}
      <div className="glass-panel p-8 rounded-xl border border-purple-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
            <FaMusic className="text-purple-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Story Music Tracks</h2>
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
              Upload background music to enhance your story's audio experience
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
                          {music.title || `Music Track ${music.id.slice(0, 8)}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                          {music.scene_number ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                              Scene {music.scene_number}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              Entire Story
                            </span>
                          )}
                          <span>•</span>
                          <span>Volume: {Math.round(music.volume_level * 100)}%</span>
                          <span>•</span>
                          <span>{music.is_looping ? 'Looping' : 'No Loop'}</span>
                          {music.duration_seconds && (
                            <>
                              <span>•</span>
                              <span>{Math.round(music.duration_seconds)}s</span>
                            </>
                          )}
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

                  <form action={deleteStoryBackgroundMusic} className="flex-shrink-0">
                    <input type="hidden" name="musicId" value={music.id} />
                    <input type="hidden" name="storyId" value={storyId} />
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

