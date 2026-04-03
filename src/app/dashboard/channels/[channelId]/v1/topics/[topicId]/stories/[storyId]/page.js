// import { generateScript, updateGeneratedScript } from '@/lib/actions';
import { generateScript, updateGeneratedScript } from '../../../../../../../../../lib/actions';
import { supabase } from '../../../../../../../../../lib/supabase';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaMagic,
  FaImage,
  FaEdit,
  FaClock,
  FaExternalLinkAlt,
  FaCopy,
  FaUpload,
  FaMusic,
  FaPlay,
  FaVideo,
  FaCamera,
  FaTrashAlt,
} from 'react-icons/fa';
import { HiSparkles, HiPhoto } from 'react-icons/hi2';
import { notFound } from 'next/navigation';
import StoryThumbnailUpload from './StoryThumbnailUpload';
import GenerateScriptButton from "../../../../../../../../../components/stories/GenerateScriptButton"

import CopyButton from '../../../../../../../../../components/stories/CopyButton';
import EditableGeneratedScript from '../../../../../../../../../components/stories/EditableGeneratedScript';
import CollapsibleSection from '../../../../../../../../../components/ui/CollapsibleSection';
import GenerateAudioButton from '../../../../../../../../../components/stories/GenerateAudioButton';
import GenerateSceneAudioButton from '../../../../../../../../../components/stories/GenerateSceneAudioButton';
import SceneAudioPlayer from '../../../../../../../../../components/stories/SceneAudioPlayer';
import SceneAudioCard from '../../../../../../../../../components/stories/SceneAudioCard';
import GenerateAllImagesButton from '../../../../../../../../../components/stories/GenerateAllImagesButton';
import VisualAssetsControls from '../../../../../../../../../components/stories/VisualAssetsControls';
import GenerateAllSceneFramesButton from '../../../../../../../../../components/stories/GenerateAllSceneFramesButton';
import GenerateSceneFrameVideoButton from '../../../../../../../../../components/stories/GenerateSceneFrameVideoButton';
import MergeVideosButton from '../../../../../../../../../components/stories/MergeVideosButton';
import { getChannel } from '../../../../../../../../../lib/actions';

const MAX_SECTION_HEIGHT = '600px';

export default async function StoryDetailPage({ params }) {
  const { channelId, topicId, storyId } = await params;
  const [channel] = await Promise.all([
    getChannel(channelId),
  ]);

  const { data: story } = await supabase
    .from('stories')
    .select('*, story_images(*), story_audio(*), story_video_frames(*)')
    .eq('id', storyId)
    .single();

  if (!story) {
    notFound();
  }

  const images = story.story_images?.sort((a, b) => a.order_index - b.order_index) || [];
  const audioFiles = story.story_audio?.sort((a, b) => (a.scene_number || 0) - (b.scene_number || 0)) || [];
  const videoFrames = story.story_video_frames?.sort((a, b) => (a.scene_number || 0) - (b.scene_number || 0)) || [];
  const wordCount = story.content.split(/\s+/).filter(Boolean).length;

  // Parse script to count scenes and get scene data
  let totalScenes = 0;
  let scenesWithImages = 0;
  let scriptScenes = [];
  try {
    if (story.generated_script) {
      const scriptData = JSON.parse(story.generated_script);
      if (scriptData?.scenes && Array.isArray(scriptData.scenes)) {
        scriptScenes = scriptData.scenes;
        totalScenes = scriptData.scenes.length;
        scenesWithImages = scriptData.scenes.filter(
          (scene) => scene.numberOfImages && scene.numberOfImages > 0
        ).length;
      }
    }
  } catch (err) {
    // If script is not JSON or doesn't have scenes, totalScenes stays 0
  }

  // Create a map of scene_number to audio for quick lookup
  const audioByScene = new Map();
  audioFiles.forEach((audio) => {
    if (audio.scene_number != null) {
      audioByScene.set(audio.scene_number, audio);
    }
  });

  // Create a map of scene_number to video frames for quick lookup
  const videoFramesByScene = new Map();
  videoFrames.forEach((frame) => {
    if (frame.scene_number != null) {
      videoFramesByScene.set(frame.scene_number, frame);
    }
  });

  const scenesWithAudio = audioByScene.size;
  const scenesWithVideoFrames = videoFramesByScene.size;

  const imagesByScene = new Map();
  images.forEach((image) => {
    if (image.scene_number != null) {
      if (!imagesByScene.has(image.scene_number)) {
        imagesByScene.set(image.scene_number, []);
      }
      imagesByScene.get(image.scene_number).push(image);
    }
  });

  // Fetch user's voice clones
  const { data: voices } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('clone_status', 'completed')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Back Navigation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/channels/${channelId}/v1/topics/${topicId}`}
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all group shadow-sm hover:shadow-md"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Topic</span>
            </Link>

            <div className="flex items-center gap-3">
              <CopyButton
                text={story.content}
                label="Copy Story"
                variant="secondary"
                icon={<FaCopy />}
              />
              <Link
                href={`/dashboard/channels/${channelId}/v1/topics/${topicId}/stories/${storyId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all group"
              >
                <FaEdit className="group-hover:rotate-12 transition-transform" />
                <span className="font-medium">Edit Story</span>
              </Link>
            </div>
          </div>

          {/* Story Header Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/80 to-amber-50 border border-amber-200/50 p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-amber-200 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />
                      <span className="text-sm font-semibold text-amber-800">Story</span>
                    </div>

                    {story.script_generated && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
                        <HiSparkles className="text-emerald-600 text-sm" />
                        <span className="text-sm font-semibold text-emerald-700">Script Generated</span>
                      </div>
                    )}
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                    {story.title}
                  </h1>

                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-amber-500" />
                      <span className="text-sm font-medium">
                        Created {new Date(story.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      • {wordCount} words
                    </div>
                  </div>
                </div>

                <GenerateScriptButton isGenerated={story.script_generated} storyId={story.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Story Thumbnail Section */}
            <CollapsibleSection
              title="Story Thumbnail"
              subtitle="Main image representing your story"
              icon={
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-100 to-blue-100 border border-cyan-200">
                  <FaCamera className="text-2xl text-cyan-600" />
                </div>
              }
              defaultOpen={true}
              borderTopColor="from-cyan-500 to-blue-500"
              cardClassName="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
              maxHeight={MAX_SECTION_HEIGHT}
            >
              <StoryThumbnailUpload 
                channelId={channelId}
                topicId={topicId}
                storyId={storyId}
                initialThumbnailUrl={story.thumbnail_url}
                storyTitle={story.title}
              />

              {/* Thumbnail Tips moved outside the control since it's common */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200 mt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <HiSparkles className="text-cyan-500" />
                    Thumbnail Tips
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Use high-quality images (1280x720px recommended)</li>
                    <li>• Add text overlays for better context</li>
                    <li>• Use bright, contrasting colors to grab attention</li>
                    <li>• Ensure the main subject is clearly visible</li>
                  </ul>
                </div>
            </CollapsibleSection>

            {/* Story Content */}
            <CollapsibleSection
              title="Story Content"
              subtitle="Original content and ideas"
              icon={
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100">
                  <span className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full block"></span>
                </div>
              }
              defaultOpen={false}
              borderTopColor="from-amber-500 via-orange-500 to-amber-500"
              cardClassName="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
              maxHeight={MAX_SECTION_HEIGHT}
            >
              <div className="prose prose-lg max-w-none">
                <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-gray-100">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-[15px]">
                    {story.content}
                  </pre>
                </div>
              </div>
            </CollapsibleSection>

            {/* Generated Script */}
            {(story.script_generated || story.generated_script) && (
              <CollapsibleSection
                title="Generated Script"
                subtitle="AI-powered script ready for production"
                icon={
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200">
                    <FaMagic className="text-2xl text-emerald-600" />
                  </div>
                }
                defaultOpen={false}
                borderTopColor="from-emerald-500 to-emerald-400"
                cardClassName="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-emerald-50 border border-emerald-200 shadow-sm"
                headerActions={
                  <CopyButton
                    text={story.generated_script}
                    label="Copy Script"
                    variant="primary"
                    icon={<FaCopy />}
                    size="md"
                  />
                }
                maxHeight={MAX_SECTION_HEIGHT}
              >
                <EditableGeneratedScript
                  storyId={story.id}
                  initialScript={story.generated_script}
                  updateAction={updateGeneratedScript}
                />
              </CollapsibleSection>
            )}

            {/* Script Audio */}
            {scriptScenes.length > 0 && (
              <CollapsibleSection
                title="Script Audio"
                subtitle="Voiceover, music, and sound effects for this story"
                icon={
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-fuchsia-100 border border-purple-200">
                    <FaMusic className="text-2xl text-purple-600" />
                  </div>
                }
                defaultOpen={false}
                borderTopColor="from-purple-500 to-fuchsia-500"
                cardClassName="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
                headerActions={
                  <GenerateAudioButton
                    storyId={story.id}
                    variant="primary"
                    label="Generate All"
                    voices={voices || []}
                  />
                }
                maxHeight={MAX_SECTION_HEIGHT}
              >
                <div className="space-y-4">
                  {scriptScenes.map((scene) => {
                    const audio = audioByScene.get(scene.sceneNumber);
                    return (
                      <SceneAudioCard
                        key={scene.sceneNumber}
                        scene={scene}
                        audio={audio}
                        storyId={story.id}
                        GenerateScriptButton={
                          <GenerateSceneAudioButton
                            storyId={story.id}
                            sceneNumber={scene.sceneNumber}
                            sceneTitle={scene.title}
                            voices={voices || []}
                          />
                        }
                      />
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Visual Assets - only shown when script has been generated */}
            {story.script_generated && (
              <CollapsibleSection
                title="Visual Assets"
                subtitle="Images for this story"
                icon={
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100">
                    <FaImage className="text-2xl text-blue-600" />
                  </div>
                }
                defaultOpen={false}
                borderTopColor="from-blue-500 to-indigo-500"
                cardClassName="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
                headerActions={
                  <VisualAssetsControls storyId={story.id} />
                }
                maxHeight={MAX_SECTION_HEIGHT}
              >
                {images.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-blue-200 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                      <HiPhoto className="text-3xl text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Yet</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                      Add images to enhance your story visualization
                    </p>
                    <button className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                      <FaImage className="group-hover:scale-110 transition-transform" />
                      <span>Upload Images</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((img, index) => (
                        <div key={img.id} className="relative group">
                          <div className="aspect-video rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-300 shadow-sm">
                            <img
                              src={img.image_url}
                              alt={`Story visual ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <span className="text-xs text-white/90 font-medium bg-black/40 px-2 py-1 rounded-full">
                                Image {index + 1}
                              </span>
                              <a
                                href={img.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-white bg-black/60 hover:bg-white hover:text-black px-3 py-1.5 rounded-full border border-white/30 transition-colors"
                              >
                                <FaExternalLinkAlt className="text-[10px]" />
                                <span>Full View</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <button className="group w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                        <FaUpload className="group-hover:scale-110 transition-transform" />
                        <span>Add More Images</span>
                      </button>
                    </div>
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Scene Videos */}
            {scriptScenes.length > 0 && (
              <CollapsibleSection
                title="Scene Videos"
                subtitle="Video frames for each scene"
                icon={
                  <div className="p-3 rounded-xl bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200">
                    <FaVideo className="text-2xl text-violet-600" />
                  </div>
                }
                defaultOpen={false}
                borderTopColor="from-violet-500 to-purple-500"
                cardClassName="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
                headerActions={
                  <GenerateAllSceneFramesButton storyId={story.id} />
                }
                maxHeight={MAX_SECTION_HEIGHT}
              >
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {scriptScenes.map((scene) => {
                    const videoFrame = videoFramesByScene.get(scene.sceneNumber);

                    return (
                      <div
                        key={scene.sceneNumber}
                        className="group rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-purple-50/40 p-3 hover:border-violet-300 transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold">
                              {scene.sceneNumber}
                            </span>
                            <h4 className="font-semibold text-gray-800 truncate">
                              {scene.title || `Scene ${scene.sceneNumber}`}
                            </h4>
                          </div>

                          {videoFrame ? (
                            <>
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-violet-200 bg-black">
                                <video
                                  controls
                                  preload="metadata"
                                  className="w-full h-full object-cover"
                                  poster={videoFrame.frame_video_url}
                                >
                                  <source src={videoFrame.frame_video_url} type="video/mp4" />
                                </video>
                              </div>

                              <a
                                href={videoFrame.frame_video_url}
                                download
                                className="inline-flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-semibold transition-colors"
                              >
                                <FaExternalLinkAlt />
                                Download
                              </a>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 border border-dashed border-violet-200 rounded-lg bg-violet-50/40">
                              <FaVideo className="text-2xl text-violet-400 mb-2" />
                              <p className="text-xs text-gray-500 mb-2 text-center">
                                No video yet
                              </p>
                              <GenerateSceneFrameVideoButton
                                storyId={story.id}
                                sceneNumber={scene.sceneNumber}
                                sceneTitle={scene.title}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            <MergeVideosButton
              storyId={story.id}
              isEnabled={totalScenes > 0 && scenesWithVideoFrames === totalScenes}
            />

            {story.completion_status && (
              <CollapsibleSection
                title="Completed Story Video"
                subtitle="The final merged video ready for distribution"
                icon={
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200">
                    <FaPlay className="text-2xl text-emerald-600" />
                  </div>
                }
                defaultOpen={true}
                borderTopColor="from-emerald-500 to-teal-500"
                cardClassName="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg mt-8"
                maxHeight="1000px"
              >
                <div className="space-y-6">
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-emerald-100 bg-black shadow-inner">
                    <video
                      controls
                      className="w-full h-full"
                      src={story.completd_video_url || story.public_url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href={story.completd_video_url || story.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all"
                    >
                      <FaExternalLinkAlt />
                      Open in New Tab
                    </a>
                    <a
                      href={story.completd_video_url || story.public_url}
                      download={`${story.title.replace(/\s+/g, '_')}_final.mp4`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                    >
                      <FaVideo />
                      Download Final Video
                    </a>
                  </div>
                </div>
              </CollapsibleSection>
            )}

          </div>

          {/* Right Column - Stats */}
          <div className="space-y-8">
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
              <h3 className="text-lg font-semibold mb-4">Story Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Word Count</span>
                  <span className="font-semibold">{wordCount} words</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Thumbnail</span>
                  <span className={`font-semibold ${story.thumbnail_url ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {story.thumbnail_url ? 'Uploaded' : 'Not Set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Script Status</span>
                  <span className={`font-semibold ${story.script_generated ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {story.script_generated ? 'Generated' : 'Pending'}
                  </span>
                </div>
                {totalScenes > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Script Scenes</span>
                    <span className="font-semibold">{totalScenes} scenes</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Scenes with Audio</span>
                  <span className={`font-semibold ${scenesWithAudio > 0 ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {scenesWithAudio} / {totalScenes || '?'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Scenes with Images</span>
                  <span className={`font-semibold ${images.length > 0 ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {images.length > 0 ? scenesWithImages : 0} / {totalScenes || '?'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Scenes with Videos</span>
                  <span className={`font-semibold ${scenesWithVideoFrames > 0 ? 'text-violet-300' : 'text-gray-400'}`}>
                    {scenesWithVideoFrames} / {totalScenes || '?'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Images</span>
                  <span className="font-semibold">{images.length} attached</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Last Updated</span>
                  <span className="font-semibold text-sm">
                    {new Date(story.updated_at || story.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}