'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTimes, FaSpinner, FaImage, FaFont, FaEdit, FaSlidersH } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateTopicConfig } from '../../lib/actions';

export default function EditTopicConfigForm({ topic, channelId }) {
  const router = useRouter();
  const [imageGenerationTheme, setImageGenerationTheme] = useState(topic.image_generation_theme || '');
  const [storyThumbnailPrompt, setStoryThumbnailPrompt] = useState(topic.story_thumbnail_prompt || '');
  const [selectedFont, setSelectedFont] = useState(topic.thumbnail_font || 'Inter-Bold.ttf');
  const [isPending, startTransition] = useTransition();

  const availableFonts = [
    { name: 'Inter Bold', value: 'Inter-Bold.ttf', family: 'Inter' },
    { name: 'Aclonica Regular', value: 'Aclonica-Regular.ttf', family: 'Aclonica' },
    { name: 'Barriecito Regular', value: 'Barriecito-Regular.ttf', family: 'Barriecito' },
    { name: 'Love Ya Like A Sister', value: 'LoveYaLikeASister-Regular.ttf', family: 'Love Ya Like A Sister' },
    { name: 'Manrope Bold', value: 'Manrope-Bold.ttf', family: 'Manrope' },
    { name: 'Manrope ExtraBold', value: 'Manrope-ExtraBold.ttf', family: 'Manrope' },
    { name: 'Protest Revolution', value: 'ProtestRevolution-Regular.ttf', family: 'Protest Revolution' },
    { name: 'Rammetto One', value: 'RammettoOne-Regular.ttf', family: 'Rammetto One' },
  ];

  const handleSave = () => {
    const formData = new FormData();
    formData.set('topicId', topic.id);
    formData.set('channelId', channelId);
    formData.set('image_generation_theme', imageGenerationTheme.trim());
    formData.set('story_thumbnail_prompt', storyThumbnailPrompt.trim());
    formData.set('thumbnail_font', selectedFont);

    startTransition(async () => {
      try {
        const result = await updateTopicConfig(formData);
        if (result?.success) {
          toast.success('Topic settings updated successfully!');
          router.push(`/dashboard/channels/${channelId}/v1/topics/${topic.id}`);
          router.refresh();
        } else {
          throw new Error('Update failed');
        }
      } catch (err) {
        toast.error(err.message || 'Failed to save configuration');
      }
    });
  };

  const handleCancel = () => {
    router.push(`/dashboard/channels/${channelId}/v1/topics/${topic.id}`);
  };

  const selectedFontFamily = availableFonts.find((f) => f.value === selectedFont)?.family || 'Inter';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── LEFT COLUMN: EDIT FORM ── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-7 shadow-sm space-y-6">
          {/* Section 1: Thumbnail Prompt */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <FaImage className="text-orange-500 text-xs" />
              Thumbnail Image Prompt
            </label>
            <p className="text-xs text-stone-400">
              Initial prompt instructions used by the AI generator to design the background image.
            </p>
            <textarea
              value={storyThumbnailPrompt}
              onChange={(e) => setStoryThumbnailPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. A mystery detective office at midnight with neon rain outside the window..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-stone-900 leading-relaxed placeholder:text-stone-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* Section 2: Generation Theme */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <FaSlidersH className="text-orange-500 text-xs" />
              Image Generation Theme
            </label>
            <p className="text-xs text-stone-400">
              Defines the global artistic style, mood, and grading of generated scenes.
            </p>
            <textarea
              value={imageGenerationTheme}
              onChange={(e) => setImageGenerationTheme(e.target.value)}
              rows={3}
              placeholder="e.g. Cinematic lighting, photorealistic, 8k resolution, dark horror aesthetic..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-stone-900 leading-relaxed placeholder:text-stone-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* Section 3: Font Dropdown Selection */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <FaFont className="text-orange-500 text-xs" />
              Thumbnail Text Overlay Font
            </label>
            <p className="text-xs text-stone-400">
              Select the font style applied dynamically to clickbait titles on all story thumbnails.
            </p>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              disabled={isPending}
              style={{ fontFamily: selectedFontFamily }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm bg-white font-bold text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {availableFonts.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.family }}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-md shadow-orange-500/20 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <FaSpinner className="text-xs animate-spin" />
                  Saving Configuration…
                </>
              ) : (
                <>
                  <FaCheck className="text-xs" />
                  Save Configuration
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-stone-500 hover:bg-gray-100 transition-all"
            >
              <FaTimes className="inline mr-1.5 text-xs" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: INTERACTIVE PREVIEW ── */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            Font Style Preview
          </h3>
          <p className="text-xs text-stone-400 mb-4">
            A real-time simulation of how the text outline and colors render on generated story thumbnails.
          </p>

          {/* 16:9 Visual Preview Box */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-tr from-stone-950 via-stone-900 to-amber-950 border border-stone-800 shadow-md flex items-center justify-start pl-[8%] select-none">
            {/* Grid Pattern overlay for details */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            
            {/* Colored Ambient light overlay */}
            <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div 
              className="font-black leading-[1.1] text-[clamp(1rem,3.2vw,2.5rem)] tracking-tight uppercase"
              style={{
                fontFamily: selectedFontFamily,
                textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 4px 4px 6px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ color: '#FBBF24' }}>VIRAL</div>
              <div style={{ color: '#FFFFFF' }}>CLICKBAIT</div>
              <div style={{ color: '#FFFFFF' }}>PREVIEW!</div>
            </div>

            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-[9px] font-bold text-white px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider">
              Preview
            </div>
          </div>

          <div className="mt-4 p-4.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1.5">
              <FaFont className="text-orange-500 text-[10px]" />
              Selected Font File
            </h4>
            <code className="block text-[11px] font-mono text-stone-500 bg-white p-2 rounded border border-gray-200 truncate">
              {selectedFont}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
