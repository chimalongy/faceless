'use client';

import { useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'react-hot-toast';
import { FaUpload, FaMusic } from 'react-icons/fa';

function SubmitButton({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 text-white font-semibold text-sm transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <FaUpload className="text-xs" />
          Upload Music
        </>
      )}
    </button>
  );
}

export default function BackgroundMusicUploadForm({ topicId, storyId, scriptScenes = [] }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [volumeLevel, setVolumeLevel] = useState(0.5);
  const [sceneNumber, setSceneNumber] = useState('');
  const [isLooping, setIsLooping] = useState(true);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        toast.error('Please select a valid audio file (MP3, WAV, OGG, or M4A)');
        return;
      }

      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 50MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a music file');
      return;
    }

    const formData = new FormData();
    if (topicId) formData.append('topicId', topicId);
    if (storyId) formData.append('storyId', storyId);
    formData.append('music', selectedFile);
    formData.append('volumeLevel', volumeLevel.toString());
    if (storyId && sceneNumber) {
      formData.append('sceneNumber', sceneNumber);
      formData.append('isLooping', isLooping.toString());
    }

    try {
      if (storyId) {
        const { uploadStoryBackgroundMusic } = await import('../../lib/actions');
        await uploadStoryBackgroundMusic(formData);
      } else {
        const { uploadBackgroundMusic } = await import('../../lib/actions');
        await uploadBackgroundMusic(formData);
      }

      toast.success('Background music uploaded successfully!');
      setSelectedFile(null);
      setVolumeLevel(0.5);
      setSceneNumber('');
      setIsLooping(true);
      const fileInput = document.getElementById('music-file');
      if (fileInput) fileInput.value = '';
      window.location.reload();
    } catch (error) {
      toast.error(error.message || 'Failed to upload music');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      <div className="space-y-2">
        <label htmlFor="music-file" className="text-sm font-medium text-stone-700">
          Music File <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="file"
            id="music-file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,.mp3,.wav,.ogg,.m4a"
            onChange={handleFileChange}
            className="hidden"
            required
          />
          <label
            htmlFor="music-file"
            className="flex items-center gap-3 px-5 py-4 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all"
          >
            <div className="p-2 bg-purple-50 rounded-lg">
              <FaMusic className="text-purple-500" />
            </div>
            <div className="flex-1">
              {selectedFile ? (
                <div>
                  <p className="font-medium text-stone-900 text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-stone-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-stone-900 text-sm">Click to select music file</p>
                  <p className="text-xs text-stone-400">MP3, WAV, OGG, or M4A (max 50MB)</p>
                </div>
              )}
            </div>
            <FaUpload className="text-purple-400" />
          </label>
        </div>
      </div>

      {storyId && scriptScenes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Scene Assignment */}
          <div className="space-y-2">
            <label htmlFor="sceneNumber" className="text-sm font-medium text-stone-700">
              Assign to Scene (Optional)
            </label>
            <select
              id="sceneNumber"
              value={sceneNumber}
              onChange={(e) => setSceneNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-sm"
            >
              <option value="">Entire Story</option>
              {scriptScenes.map((scene) => (
                <option key={scene.sceneNumber} value={scene.sceneNumber}>
                  Scene {scene.sceneNumber}: {scene.title || 'Untitled Scene'}
                </option>
              ))}
            </select>
          </div>

          {/* Looping Option */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Looping</label>
            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isLooping}
                  onChange={() => setIsLooping(true)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-stone-600">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isLooping}
                  onChange={() => setIsLooping(false)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-stone-600">No</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Volume Level */}
      <div className="space-y-2">
        <label htmlFor="volumeLevel" className="text-sm font-medium text-stone-700">
          Volume Level: <span className="text-purple-600 font-semibold">{Math.round(volumeLevel * 100)}%</span>
        </label>
        <input
          type="range"
          id="volumeLevel"
          min="0"
          max="1"
          step="0.01"
          value={volumeLevel}
          onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
          className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-stone-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <SubmitButton disabled={!selectedFile} />
      </div>
    </form>
  );
}