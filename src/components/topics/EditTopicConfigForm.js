'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTimes, FaSpinner, FaImage, FaFont, FaSlidersH, FaAlignLeft, FaAlignCenter, FaAlignRight, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateTopicConfig } from '../../lib/actions';

export default function EditTopicConfigForm({ topic, channelId }) {
  const router = useRouter();
  const [imageGenerationTheme, setImageGenerationTheme] = useState(topic.image_generation_theme || '');
  const [storyThumbnailPrompt, setStoryThumbnailPrompt] = useState(topic.story_thumbnail_prompt || '');
  const [selectedFont, setSelectedFont] = useState(topic.thumbnail_font || 'Inter-Bold.ttf');
  
  // Custom layout style states
  const [thumbnailTextSize, setThumbnailTextSize] = useState(topic.thumbnail_text_size || 7.5);
  const [thumbnailTextAlign, setThumbnailTextAlign] = useState(topic.thumbnail_text_align || 'left');
  const [thumbnailTextPosition, setThumbnailTextPosition] = useState(topic.thumbnail_text_position || 'center');
  
  const [isPending, startTransition] = useTransition();

  // Quote custom font families so they resolve with spaces in CSS font-family rules
  const availableFonts = [
    { name: 'Inter Bold', value: 'Inter-Bold.ttf', family: '"Inter", sans-serif' },
    { name: 'Aclonica Regular', value: 'Aclonica-Regular.ttf', family: '"Aclonica", sans-serif' },
    { name: 'Barriecito Regular', value: 'Barriecito-Regular.ttf', family: '"Barriecito", cursive' },
    { name: 'Love Ya Like A Sister', value: 'LoveYaLikeASister-Regular.ttf', family: '"Love Ya Like A Sister", cursive' },
    { name: 'Manrope Bold', value: 'Manrope-Bold.ttf', family: '"Manrope", sans-serif' },
    { name: 'Manrope ExtraBold', value: 'Manrope-ExtraBold.ttf', family: '"Manrope", sans-serif' },
    { name: 'Protest Revolution', value: 'ProtestRevolution-Regular.ttf', family: '"Protest Revolution", cursive' },
    { name: 'Rammetto One', value: 'RammettoOne-Regular.ttf', family: '"Rammetto One", sans-serif' },
  ];

  const handleSave = () => {
    const formData = new FormData();
    formData.set('topicId', topic.id);
    formData.set('channelId', channelId);
    formData.set('image_generation_theme', imageGenerationTheme.trim());
    formData.set('story_thumbnail_prompt', storyThumbnailPrompt.trim());
    formData.set('thumbnail_font', selectedFont);
    formData.set('thumbnail_text_size', String(thumbnailTextSize));
    formData.set('thumbnail_text_align', thumbnailTextAlign);
    formData.set('thumbnail_text_position', thumbnailTextPosition);

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
              rows={10}
              placeholder="e.g. A mystery detective office at midnight with neon rain outside the window..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-stone-900 leading-relaxed placeholder:text-stone-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-y min-h-[150px]"
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
              rows={10}
              placeholder="e.g. Cinematic lighting, photorealistic, 8k resolution, dark horror aesthetic..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-stone-900 leading-relaxed placeholder:text-stone-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-y min-h-[150px]"
            />
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Section 3: Thumbnail Text Style Settings */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <FaFont className="text-orange-500 text-xs" />
              Clickbait Text Style
            </h3>

            {/* Font Picker */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-stone-600">
                Font Family
              </label>
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

            {/* Text Size Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-stone-600">
                  Text Size Percentage (Width of image)
                </label>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                  {thumbnailTextSize}%
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="15"
                step="0.5"
                value={thumbnailTextSize}
                onChange={(e) => setThumbnailTextSize(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <p className="text-[10px] text-stone-400">
                Controls the proportional size of the text relative to the overall image width. Default is 7.5%.
              </p>
            </div>

            {/* Text Alignment & Horizontal Position */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-stone-600">
                Horizontal Position & Alignment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'left', label: 'Left Align', icon: <FaAlignLeft /> },
                  { value: 'center', label: 'Center Align', icon: <FaAlignCenter /> },
                  { value: 'right', label: 'Right Align', icon: <FaAlignRight /> },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setThumbnailTextAlign(item.value)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      thumbnailTextAlign === item.value
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 bg-white text-stone-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Position */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-stone-600">
                Vertical Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'top', label: 'Top', icon: <FaArrowUp className="text-[10px]" /> },
                  { value: 'center', label: 'Center', icon: <span className="w-1.5 h-1.5 rounded-full bg-current" /> },
                  { value: 'bottom', label: 'Bottom', icon: <FaArrowDown className="text-[10px]" /> },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setThumbnailTextPosition(item.value)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      thumbnailTextPosition === item.value
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 bg-white text-stone-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-6">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
            Font Style Preview
          </h3>
          <p className="text-xs text-stone-400 mb-4">
            A real-time simulation of how the text size, position, and alignment render on generated story thumbnails.
          </p>

          {/* 16:9 Visual Preview Box */}
          <div 
            className={`relative aspect-video rounded-xl overflow-hidden bg-gradient-to-tr from-stone-950 via-stone-900 to-amber-950 border border-stone-800 shadow-md flex flex-col select-none transition-all duration-300 ${
              thumbnailTextPosition === 'top' ? 'justify-start pt-[5%]' : 
              thumbnailTextPosition === 'bottom' ? 'justify-end pb-[5%]' : 'justify-center'
            } ${
              thumbnailTextAlign === 'left' ? 'items-start pl-[8%] pr-[20%] text-left' :
              thumbnailTextAlign === 'right' ? 'items-end pr-[8%] pl-[20%] text-right' : 'items-center text-center px-[8%] w-full'
            }`} 
            style={{ containerType: 'inline-size' }}
          >
            {/* Grid Pattern overlay for details */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            
            {/* Colored Ambient light overlay */}
            <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div 
              className="font-black leading-[1.1] tracking-tight uppercase"
              style={{
                fontFamily: selectedFontFamily,
                fontSize: thumbnailTextSize + 'cqw',
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
              Selected Font Style
            </h4>
            <div className="space-y-1 text-[11px] text-stone-500">
              <div className="flex justify-between">
                <span>Font File:</span>
                <span className="font-mono">{selectedFont}</span>
              </div>
              <div className="flex justify-between">
                <span>Horizontal Align:</span>
                <span className="font-bold text-orange-600 uppercase">{thumbnailTextAlign}</span>
              </div>
              <div className="flex justify-between">
                <span>Vertical Position:</span>
                <span className="font-bold text-orange-600 uppercase">{thumbnailTextPosition}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
