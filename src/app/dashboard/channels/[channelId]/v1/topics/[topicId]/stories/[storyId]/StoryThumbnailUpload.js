'use client';

import { useState } from 'react';
import { FaCamera, FaTrashAlt, FaUpload, FaSpinner, FaMagic } from 'react-icons/fa';
import { updateStoryThumbnail, deleteStoryThumbnail } from '../../../../../../../../../lib/actions';
import toast from 'react-hot-toast';

export default function StoryThumbnailUpload({ channelId, topicId, storyId, initialThumbnailUrl, storyTitle }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
        <div className="relative group">
          <div className="aspect-video rounded-xl overflow-hidden border-2 border-cyan-200 shadow-lg">
            <img
              src={initialThumbnailUrl}
              alt={`Thumbnail for ${storyTitle}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent ${isUploading ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300 rounded-xl`}>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
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
                    <span>Change Thumbnail</span>
                  </>
                )}
              </label>
              <button 
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                <FaTrashAlt />
                <span>Remove</span>
              </button>
            </div>
            {/* Absolute center Generate button for when thumbnail exists */}
            <button
                onClick={handleGenerate}
                disabled={isUploading || isGenerating}
                className={`absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white text-cyan-600 shadow-lg hover:shadow-cyan-500/20 transition-all ${isUploading || isGenerating ? 'opacity-0 scale-90' : 'opacity-0 group-hover:opacity-100 scale-100'} cursor-pointer`}
                title="AI Generate Thumbnail"
            >
                <FaMagic className={isGenerating ? 'animate-spin' : ''} />
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
