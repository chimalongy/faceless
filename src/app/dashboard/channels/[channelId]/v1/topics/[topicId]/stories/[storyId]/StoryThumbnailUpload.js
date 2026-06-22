'use client';

import { useState } from 'react';
import { FaCamera, FaTrashAlt, FaUpload, FaSpinner, FaMagic, FaDownload } from 'react-icons/fa';
import { updateStoryThumbnail, deleteStoryThumbnail } from '../../../../../../../../../lib/actions';
import toast from 'react-hot-toast';

export default function StoryThumbnailUpload({ channelId, topicId, storyId, initialThumbnailUrl, storyTitle, topicFont }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const wrapText = (txt, maxChars = 11) => {
    if (!txt) return [];
    const words = txt.toUpperCase().split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const handleDownload = async () => {
    if (!initialThumbnailUrl) return;

    const t = toast.loading('Preparing download…');
    try {
      const res = await fetch(initialThumbnailUrl);
      if (!res.ok) throw new Error('Failed to download thumbnail');

      const blob = await res.blob();
      const contentType = res.headers.get('content-type') || '';

      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
      else {
        try {
          const urlPath = new URL(initialThumbnailUrl, window.location.href).pathname;
          const last = urlPath.split('/').pop() || '';
          const m = last.match(/\.([a-zA-Z0-9]+)$/);
          if (m?.[1]) ext = m[1].toLowerCase();
        } catch {
          // ignore URL parsing errors
        }
      }

      const safeTitle = (storyTitle || 'story')
        .toString()
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80) || 'story';

      const filename = `${safeTitle}_thumbnail.${ext}`;

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success('Thumbnail downloaded', { id: t });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Failed to download thumbnail', { id: t });
      // Fallback: at least open the image so user can save manually
      try {
        window.open(initialThumbnailUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // ignore
      }
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Client-side validation
    const maxSize = 6 * 1024 * 1024; // 6MB
    if (file.size > maxSize) {
      toast.error('File size too large. Max 6MB');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Uploading thumbnail...');

    try {
      const formData = new FormData();
      formData.append('channelId', channelId);
      formData.append('topicId', topicId);
      formData.append('storyId', storyId);
      formData.append('file', file);

      const result = await updateStoryThumbnail(formData);

      if (result.success) {
        toast.success('Thumbnail updated successfully', { id: loadingToast });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to upload thumbnail', { id: loadingToast });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this thumbnail?')) return;

    setIsUploading(true);
    const loadingToast = toast.loading('Removing thumbnail...');

    try {
      const formData = new FormData();
      formData.append('channelId', channelId);
      formData.append('topicId', topicId);
      formData.append('storyId', storyId);

      const result = await deleteStoryThumbnail(formData);

      if (result.success) {
        toast.success('Thumbnail removed successfully', { id: loadingToast });
      } else {
        throw new Error('Removal failed');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to remove thumbnail', { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const loadingToast = toast.loading('Starting AI thumbnail generation...');

    try {
      const response = await fetch('/api/generate/story-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, channelId, topicId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('AI generation task started! This may take a minute.', { id: loadingToast });
      } else {
        throw new Error(data.error || 'Failed to start generation');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to start AI generation', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Thumbnail Display */}
      {initialThumbnailUrl ? (
        <div className="space-y-3">
          <div className="relative group overflow-hidden rounded-xl">
            <div className="aspect-video rounded-xl overflow-hidden border-2 border-cyan-200 shadow-lg">
              <img
                src={initialThumbnailUrl}
                alt={`Thumbnail for ${storyTitle}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Live Text Overlay Preview */}
            <div className="absolute inset-0 flex flex-col justify-center items-start pl-[8%] pointer-events-none select-none">
              <div 
                className="font-black leading-[1.1] text-[clamp(1.2rem,5vw,3.5rem)] tracking-tight uppercase"
                style={{
                  fontFamily: availableFonts.find(f => f.value === topicFont)?.family || 'Inter',
                  textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 4px 4px 6px rgba(0,0,0,0.8)'
                }}
              >
                {wrapText(storyTitle).map((line, index) => (
                  <div key={index} style={{ color: index === 0 ? '#FBBF24' : '#FFFFFF' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Badge for clarification */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-[10px] font-bold text-white px-2 py-1 rounded-md border border-white/10 uppercase tracking-wider select-none pointer-events-none">
              Live Font Preview
            </div>
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent ${isUploading ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300 rounded-xl`}>
              <div className="absolute bottom-4 left-4 right-4 hidden sm:flex items-center justify-between gap-2">
                <label 
                  htmlFor="thumbnail-upload" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <FaSpinner className="animate-spin text-cyan-600" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaCamera className="text-cyan-600" />
                      <span>Change</span>
                    </>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isUploading || isGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    title="Download thumbnail"
                  >
                    <FaDownload className="text-cyan-600" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              {/* AI Generate button — desktop hover overlay */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isUploading || isGenerating}
                className={`absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white text-cyan-600 shadow-lg hover:shadow-cyan-500/20 transition-all ${isUploading || isGenerating ? 'opacity-0 scale-90' : 'opacity-0 group-hover:opacity-100 scale-100'} cursor-pointer`}
                title="AI Generate Thumbnail"
              >
                <FaMagic className={isGenerating ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Persistent action buttons — always visible, works on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="thumbnail-upload"
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-stone-700 rounded-xl text-sm font-medium hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 transition-all cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isUploading ? (
                <>
                  <FaSpinner className="animate-spin text-cyan-600" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <FaCamera className="text-cyan-600" />
                  <span>Change</span>
                </>
              )}
            </label>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isUploading || isGenerating}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-stone-700 rounded-xl text-sm font-medium hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 transition-all disabled:opacity-50"
            >
              <FaDownload className="text-cyan-600" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaTrashAlt />
              )}
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-cyan-200 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/30 relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 mb-4">
            {isUploading ? (
              <FaSpinner className="text-4xl text-cyan-500 animate-spin" />
            ) : (
              <FaCamera className="text-4xl text-cyan-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Thumbnail Set</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Add a thumbnail to make your story stand out and improve engagement
          </p>
          <label 
            htmlFor="thumbnail-upload"
            className={`group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaUpload className="group-hover:scale-110 transition-transform" />
            )}
            <span>Upload Thumbnail</span>
          </label>
          <div className="mt-4">
            <button
                onClick={handleGenerate}
                disabled={isUploading || isGenerating}
                className={`group inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-cyan-500 text-cyan-600 font-semibold rounded-xl hover:bg-cyan-50 transition-all cursor-pointer ${isUploading || isGenerating ? 'opacity-50' : ''}`}
            >
                <FaMagic className={isGenerating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'} />
                <span>AI Generate Thumbnail</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for thumbnail upload */}
      <input 
        id="thumbnail-upload" 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleUpload}
        disabled={isUploading}
      />
    </div>
  );
}
