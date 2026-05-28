// src/app/dashboard/channels/[channelId]/[channelType]/topics/[topicId]/stories/[storyId]/page.js
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
  FaCheckCircle,
  FaSpinner,
  FaFileAlt,
  FaRobot,
  FaPlus,
} from 'react-icons/fa';
import { HiSparkles, HiPhoto } from 'react-icons/hi2';
import { notFound } from 'next/navigation';
import StoryThumbnailUpload from './StoryThumbnailUpload';
import GenerateScriptButton from "../../../../../../../../../components/stories/GenerateScriptButton"
import UploadToYoutubeButton from './UploadToYoutubeButton';

import CopyButton from '../../../../../../../../../components/stories/CopyButton';
import EditableGeneratedScript from '../../../../../../../../../components/stories/EditableGeneratedScript';
import GenerateAudioButton from '../../../../../../../../../components/stories/GenerateAudioButton';
import GenerateSceneAudioButton from '../../../../../../../../../components/stories/GenerateSceneAudioButton';
import SceneAudioPlayer from '../../../../../../../../../components/stories/SceneAudioPlayer';
import SceneAudioCard from '../../../../../../../../../components/stories/SceneAudioCard';
import GenerateAllImagesButton from '../../../../../../../../../components/stories/GenerateAllImagesButton';
import GenerateAllSceneFramesButton from '../../../../../../../../../components/stories/GenerateAllSceneFramesButton';
import GenerateSceneFrameVideoButton from '../../../../../../../../../components/stories/GenerateSceneFrameVideoButton';
import MergeVideosButton from '../../../../../../../../../components/stories/MergeVideosButton';
import { getChannel } from '../../../../../../../../../lib/actions';
import StoryAccordionWrapper from './StoryAccordionWrapper';

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
    // totalScenes stays 0
  }

  const audioByScene = new Map();
  audioFiles.forEach((audio) => {
    if (audio.scene_number != null) {
      audioByScene.set(audio.scene_number, audio);
    }
  });

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

  const { data: voices } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('clone_status', 'completed')
    .order('created_at', { ascending: false });

  const completionRate = totalScenes > 0
    ? Math.round(((scenesWithAudio + scenesWithVideoFrames + images.length) / (totalScenes * 3)) * 100)
    : 0;


  return (
    <div className="space-y-8 pb-10 px-2">

      {/* ── BACK LINK ── */}
      <Link
        href={`/dashboard/channels/${channelId}/v1/topics/${topicId}`}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-400 hover:text-orange-500 transition-colors no-underline"
      >
        <FaArrowLeft className="text-xs" />
        Back to {channel.name}
      </Link>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {story.script_generated ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Script Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-semibold text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Draft
              </span>
            )}
          </div>
          <h1
            className="text-[22px] sm:text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {story.title}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-stone-400 mt-1 line-clamp-2">
            {story.content.substring(0, 120)}{story.content.length > 120 ? '...' : ''}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-semibold text-stone-600">
              <FaFileAlt className="text-[9px]" />
              {wordCount.toLocaleString()} words
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-semibold text-stone-600">
              <FaClock className="text-[9px]" />
              ~{Math.ceil(wordCount / 130)} min read
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <CopyButton
            text={story.content}
            label="Copy"
            variant="secondary"
            icon={<FaCopy />}
          />
          <Link
            href={`/dashboard/channels/${channelId}/v1/topics/${topicId}/stories/${storyId}/edit`}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-stone-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-all no-underline"
          >
            <FaEdit className="text-xs" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <GenerateScriptButton isGenerated={story.script_generated} storyId={story.id} />
        </div>
      </div>



      {/* ── ACCORDION SECTIONS (Client Component) ── */}
      <StoryAccordionWrapper
        channelId={channelId}
        topicId={topicId}
        storyId={storyId}
        story={story}
        images={images}
        audioFiles={audioFiles}
        videoFrames={videoFrames}
        scriptScenes={scriptScenes}
        totalScenes={totalScenes}
        scenesWithAudio={scenesWithAudio}
        scenesWithVideoFrames={scenesWithVideoFrames}
        scenesWithImages={scenesWithImages}
        voices={voices || []}
        wordCount={wordCount}
      />

    </div>
  );
}