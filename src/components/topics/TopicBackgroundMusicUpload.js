'use client';

import { useState, useTransition } from 'react';
import { FaMusic, FaUpload, FaSpinner, FaTrashAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { replaceTopicBackgroundMusic, clearTopicBackgroundMusic } from '../../lib/actions';

export default function TopicBackgroundMusicUpload({ topicId, channelId, hasMusic }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac', 'audio/x-flac'];
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(file.type) && !['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(fileExt)) {
        toast.error('Please select a valid audio file (MP3, WAV, OGG, M4A, or FLAC)');
        return;
      }

      // Max size: 50MB
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 50MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select an audio file first');
      return;
    }

    const formData = new FormData();
    formData.set('topicId', topicId);
    formData.set('channelId', channelId);
    formData.set('file', selectedFile);

    startTransition(async () => {
      try {
        await replaceTopicBackgroundMusic(formData);
        toast.success('Background music uploaded successfully!');
        setSelectedFile(null);
        // Reset file input if exists
        const fileInput = document.getElementById('topic-music-upload-input');
        if (fileInput) fileInput.value = '';
      } catch (err) {
        toast.error(err.message || 'Failed to upload background music');
      }
    });
  };

  const handleClear = () => {
    if (!confirm('Are you sure you want to remove the current background music? This will remove the audio from all associated stories.')) {
      return;
    }

    const formData = new FormData();
    formData.set('topicId', topicId);
    formData.set('channelId', channelId);

    startTransition(async () => {
      try {
        await clearTopicBackgroundMusic(formData);
        toast.success('Background music removed successfully');
      } catch (err) {
        toast.error(err.message || 'Failed to remove background music');
      }
    });
  };

  const handleCancel = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('topic-music-upload-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaUpload className="text-purple-500 text-sm" />
          </div>
          <div>
            <h2
              className="text-[16px] font-bold text-stone-900 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Custom Background Music
            </h2>
            <p className="text-[13px] text-stone-400 mt-0.5">
              Upload your own audio file to replace or set the background music
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-7 py-6 space-y-5">
        <div className="relative">
          <input
            type="file"
            id="topic-music-upload-input"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/flac,.mp3,.wav,.ogg,.m4a,.flac"
            onChange={handleFileChange}
            disabled={isPending}
            className="hidden"
          />
          <label
            htmlFor="topic-music-upload-input"
            className={`flex items-center gap-3 px-5 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              selectedFile
                ? 'border-purple-300 bg-purple-50/20'
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/10'
            }`}
          >
            <div className="p-2 bg-purple-50 rounded-lg">
              <FaMusic className="text-purple-500 text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              {selectedFile ? (
                <div>
                  <p className="font-semibold text-stone-900 text-[14px] truncate">{selectedFile.name}</p>
                  <p className="text-[12px] text-stone-400 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-stone-700 text-[14px]">Click to select music file</p>
                  <p className="text-[12px] text-stone-400 mt-0.5">MP3, WAV, M4A, or FLAC (max 50MB)</p>
                </div>
              )}
            </div>
            <FaUpload className="text-purple-400 text-xs flex-shrink-0" />
          </label>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {selectedFile ? (
            <>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[13px] font-semibold shadow-md shadow-purple-500/20 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <FaSpinner className="text-xs animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FaUpload className="text-xs" />
                    Upload &amp; Replace
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-stone-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            hasMusic && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-[13px] font-semibold hover:bg-red-50 transition-all"
              >
                {isPending ? (
                  <FaSpinner className="text-xs animate-spin" />
                ) : (
                  <FaTrashAlt className="text-xs" />
                )}
                Remove Current Music
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
