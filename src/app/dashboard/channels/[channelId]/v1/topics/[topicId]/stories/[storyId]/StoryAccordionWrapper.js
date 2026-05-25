'use client';

import { useState } from 'react';
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
  FaChevronDown,
} from 'react-icons/fa';
import { HiSparkles, HiPhoto } from 'react-icons/hi2';
import StoryThumbnailUpload from './StoryThumbnailUpload';
import GenerateScriptButton from "../../../../../../../../../components/stories/GenerateScriptButton"
import UploadToYoutubeButton from './UploadToYoutubeButton';

import CopyButton from '../../../../../../../../../components/stories/CopyButton';
import EditableGeneratedScript from '../../../../../../../../../components/stories/EditableGeneratedScript';
import GenerateAudioButton from '../../../../../../../../../components/stories/GenerateAudioButton';
import GenerateSceneAudioButton from '../../../../../../../../../components/stories/GenerateSceneAudioButton';
import SceneAudioCard from '../../../../../../../../../components/stories/SceneAudioCard';
import GenerateAllImagesButton from '../../../../../../../../../components/stories/GenerateAllImagesButton';
import VisualAssetsControls from '../../../../../../../../../components/stories/VisualAssetsControls';
import GenerateAllSceneFramesButton from '../../../../../../../../../components/stories/GenerateAllSceneFramesButton';
import GenerateSceneFrameVideoButton from '../../../../../../../../../components/stories/GenerateSceneFrameVideoButton';
import MergeVideosButton from '../../../../../../../../../components/stories/MergeVideosButton';
import { updateGeneratedScript } from '../../../../../../../../../lib/actions';

// Individual Accordion Section Component
function AccordionSection({ title, subtitle, icon, iconBg, iconColor, children, defaultOpen = false, headerActions, badge }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div 
      className={`bg-white rounded-2xl border transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'border-orange-200 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]'
      }`}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsOpen(!isOpen)}
        className="w-full flex flex-wrap items-center p-5 sm:p-6 text-left cursor-pointer group gap-y-2"
      >
        {/* Left: icon + title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              isOpen 
                ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md' 
                : `${iconBg} group-hover:bg-orange-100`
            }`}
          >
            <span className={`transition-colors ${isOpen ? 'text-white' : iconColor}`}>
              {icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase">
              {subtitle}
            </p>
            <h2
              className={`text-[16px] font-bold tracking-tight transition-colors ${
                isOpen ? 'text-orange-600' : 'text-stone-900 group-hover:text-orange-600'
              }`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {title}
            </h2>
          </div>
        </div>

        {/* Right: badge + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {badge && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-700">
              {badge}
            </span>
          )}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isOpen ? 'bg-orange-100 rotate-180' : 'bg-gray-50 group-hover:bg-orange-50'
            }`}
          >
            <FaChevronDown
              className={`text-sm transition-colors ${
                isOpen ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'
              }`}
            />
          </div>
        </div>

        {/* Header actions — full width on mobile, inline on desktop */}
        {headerActions && (
          <div
            className="w-full sm:w-auto sm:ml-auto sm:-mt-0 order-last"
            onClick={(e) => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
          <div className="border-t border-orange-100 pt-4 overflow-y-auto max-h-[260px] custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoryAccordionWrapper({
  channelId,
  topicId,
  storyId,
  story,
  images,
  audioFiles,
  videoFrames,
  scriptScenes,
  totalScenes,
  scenesWithAudio,
  scenesWithVideoFrames,
  scenesWithImages,
  voices,
  wordCount,
}) {
  // Create maps for quick lookup
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Accordions */}
      <div className="lg:col-span-2 space-y-4">

        {/* Story Thumbnail */}
        <AccordionSection
          title="Story Thumbnail"
          subtitle="Visual"
          icon={<FaCamera className="text-sm sm:text-base" />}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          defaultOpen={true}
        >
          <div className="space-y-4">
            <StoryThumbnailUpload 
              channelId={channelId}
              topicId={topicId}
              storyId={storyId}
              initialThumbnailUrl={story.thumbnail_url}
              storyTitle={story.title}
            />
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="text-sm font-semibold text-stone-800 mb-2 flex items-center gap-2">
                <HiSparkles className="text-orange-500" />
                Thumbnail Tips
              </h4>
              <ul className="text-xs text-stone-600 space-y-1">
                <li>• Use high-quality images (1280x720px recommended)</li>
                <li>• Add text overlays for better context</li>
                <li>• Use bright, contrasting colors to grab attention</li>
                <li>• Ensure the main subject is clearly visible</li>
              </ul>
            </div>
          </div>
        </AccordionSection>

        {/* Story Content */}
        <AccordionSection
          title="Story Content"
          subtitle="Content"
          icon={<FaFileAlt className="text-sm sm:text-base" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          defaultOpen={false}
        >
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <pre className="whitespace-pre-wrap font-sans text-stone-700 leading-relaxed text-[14px]">
              {story.content}
            </pre>
          </div>
        </AccordionSection>

        {/* Generated Script */}
        {(story.script_generated || story.generated_script) && (
          <AccordionSection
            title="Generated Script"
            subtitle="AI Generated"
            icon={<FaMagic className="text-sm sm:text-base" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            defaultOpen={false}
            headerActions={
              <CopyButton
                text={story.generated_script}
                label="Copy"
                variant="primary"
                icon={<FaCopy />}
                size="sm"
              />
            }
          >
            <EditableGeneratedScript
              storyId={story.id}
              initialScript={story.generated_script}
              updateAction={updateGeneratedScript}
            />
          </AccordionSection>
        )}

        {/* Script Audio */}
        {scriptScenes.length > 0 && (
          <AccordionSection
            title="Script Audio"
            subtitle="Audio"
            icon={<FaMusic className="text-sm sm:text-base" />}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            defaultOpen={false}
            headerActions={
              <GenerateAudioButton
                storyId={story.id}
                variant="primary"
                label="Generate All"
                voices={voices || []}
              />
            }
            badge={`${scenesWithAudio}/${totalScenes}`}
          >
            <div className="space-y-3">
              {scriptScenes.map((scene) => {
                const audio = audioByScene.get(scene.sceneNumber);
                return (
                  <SceneAudioCard
                    key={scene.sceneNumber}
                    scene={scene}
                    audio={audio}
                    storyId={story.id}
                    GenerateButton={
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
          </AccordionSection>
        )}

        {/* Visual Assets */}
        {story.script_generated && (
          <AccordionSection
            title="Visual Assets"
            subtitle="Visuals"
            icon={<FaImage className="text-sm sm:text-base" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            defaultOpen={false}
            headerActions={
              <VisualAssetsControls storyId={story.id} />
            }
            badge={`${images.length}`}
          >
            <div>
              {images.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-orange-200 rounded-xl bg-orange-50/30">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 mb-4">
                    <HiPhoto className="text-2xl text-orange-500" />
                  </div>
                  <h3
                    className="text-[18px] font-bold text-stone-900 mb-2"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    No Images Yet
                  </h3>
                  <p className="text-stone-400 text-sm mb-6 max-w-xs mx-auto">
                    Add images to enhance your story visualization
                  </p>
                  <button className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all">
                    <FaImage className="text-xs" />
                    <span>Upload Images</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {images.map((img, index) => (
                      <div key={img.id} className="relative group">
                        <div className="aspect-video rounded-xl overflow-hidden border-2 border-gray-100 group-hover:border-orange-300 transition-all duration-300 shadow-sm">
                          <img
                            src={img.image_url}
                            alt={`Story visual ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
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
                    <button className="group w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all">
                      <FaUpload className="text-xs" />
                      <span>Add More Images</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {/* Scene Videos */}
        {scriptScenes.length > 0 && (
          <AccordionSection
            title="Scene Videos"
            subtitle="Video"
            icon={<FaVideo className="text-sm sm:text-base" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            defaultOpen={false}
            headerActions={
              <GenerateAllSceneFramesButton storyId={story.id} />
            }
            badge={`${scenesWithVideoFrames}/${totalScenes}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scriptScenes.map((scene) => {
                const videoFrame = videoFramesByScene.get(scene.sceneNumber);

                return (
                  <div
                    key={scene.sceneNumber}
                    className="group rounded-xl border border-gray-100 bg-white p-4 hover:border-violet-200 hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold">
                          {scene.sceneNumber}
                        </span>
                        <h4 className="font-semibold text-stone-800 truncate text-sm">
                          {scene.title || `Scene ${scene.sceneNumber}`}
                        </h4>
                      </div>

                      {videoFrame ? (
                        <>
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 bg-black">
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
                            className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold transition-colors border border-violet-100"
                          >
                            <FaExternalLinkAlt className="text-[10px]" />
                            Download
                          </a>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                          <FaVideo className="text-xl text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400 mb-3 text-center">
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
          </AccordionSection>
        )}

        {/* Merge Videos */}
        <AccordionSection
          title="Merge Scene Videos"
          subtitle="Production"
          icon={<FaPlay className="text-sm sm:text-base" />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          defaultOpen={false}
        >
          <MergeVideosButton
            storyId={story.id}
            isEnabled={totalScenes > 0 && scenesWithVideoFrames === totalScenes}
          />
        </AccordionSection>

        {/* Completed Story Video */}
        {story.completion_status && (
          <AccordionSection
            title="Completed Story Video"
            subtitle="Final"
            icon={<FaCheckCircle className="text-sm sm:text-base" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            defaultOpen={true}
          >
            <div className="space-y-5">
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-emerald-100 bg-black">
                <video
                  controls
                  className="w-full h-full"
                  src={story.completd_video_url || story.public_url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={story.completd_video_url || story.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-emerald-500 text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all text-sm"
                >
                  <FaExternalLinkAlt className="text-xs" />
                  Open in New Tab
                </a>
                <a
                  href={story.completd_video_url || story.public_url}
                  download={`${story.title.replace(/\s+/g, '_')}_final.mp4`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-md shadow-emerald-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all text-sm"
                >
                  <FaVideo className="text-xs" />
                  Download Final Video
                </a>
                <UploadToYoutubeButton storyId={storyId} />
              </div>
            </div>
          </AccordionSection>
        )}

      </div>

      {/* Right Column - Stats Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-4">
            Story Stats
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-stone-500">Word Count</span>
              <span className="text-[13px] font-semibold text-stone-900">{wordCount} words</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-stone-500">Thumbnail</span>
              <span className={`text-[13px] font-semibold ${story.thumbnail_url ? 'text-emerald-600' : 'text-amber-600'}`}>
                {story.thumbnail_url ? 'Uploaded' : 'Not Set'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-stone-500">Script Status</span>
              <span className={`text-[13px] font-semibold ${story.script_generated ? 'text-emerald-600' : 'text-amber-600'}`}>
                {story.script_generated ? 'Generated' : 'Pending'}
              </span>
            </div>
            {totalScenes > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-[13px] text-stone-500">Script Scenes</span>
                <span className="text-[13px] font-semibold text-stone-900">{totalScenes} scenes</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-stone-500">Scenes with Audio</span>
              <span className={`text-[13px] font-semibold ${scenesWithAudio > 0 ? 'text-emerald-600' : 'text-stone-400'}`}>
                {scenesWithAudio} / {totalScenes || '?'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-stone-500">Scenes with Images</span>
              <span className={`text-[13px] font-semibold ${images.length > 0 ? 'text-emerald-600' : 'text-stone-400'}`}>
                {images.length > 0 ? scenesWithImages : 0} / {totalScenes || '?'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-stone-500">Scenes with Videos</span>
              <span className={`text-[13px] font-semibold ${scenesWithVideoFrames > 0 ? 'text-violet-600' : 'text-stone-400'}`}>
                {scenesWithVideoFrames} / {totalScenes || '?'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[13px] text-stone-500">Total Images</span>
              <span className="text-[13px] font-semibold text-stone-900">{images.length} attached</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-stone-500">Last Updated</span>
              <span className="text-[13px] font-semibold text-stone-900">
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
  );
}