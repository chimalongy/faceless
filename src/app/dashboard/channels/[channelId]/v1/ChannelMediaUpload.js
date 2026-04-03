'use client';

import { useState } from 'react';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import { updateChannelMedia } from '../../../../../lib/actions';
import toast from 'react-hot-toast';

export default function ChannelMediaUpload({ channelId, type, currentUrl, channelName }) {
  const [isUploading, setIsUploading] = useState(false);

  const validateImage = (file, type) => {
    return new Promise((resolve, reject) => {
      // 1. Check File Size
      const maxSize = type === 'picture' ? 4 * 1024 * 1024 : 6 * 1024 * 1024;
      if (file.size > maxSize) {
        return reject(`File size too large. Max ${type === 'picture' ? '4MB' : '6MB'}`);
      }

      // 2. Check Format for picture
      if (type === 'picture' && file.type !== 'image/png') {
        return reject('Channel picture must be a PNG file');
      }

      // 3. Check Dimensions
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const targetWidth = type === 'picture' ? 94 : 2048;
        const targetHeight = type === 'picture' ? 94 : 1152;

        if (img.width !== targetWidth || img.height !== targetHeight) {
          return reject(`Invalid dimensions. Must be ${targetWidth}x${targetHeight} pixels (got ${img.width}x${img.height})`);
        }
        resolve(true);
      };
      img.onerror = () => reject('Failed to load image for validation');
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const loadingToast = toast.loading(`Uploading ${type}...`);

    try {
      await validateImage(file, type);

      const formData = new FormData();
      formData.append('channelId', channelId);
      formData.append('type', type);
      formData.append('file', file);

      const result = await updateChannelMedia(formData);

      if (result.success) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`, { id: loadingToast });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error(error);
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to upload', { id: loadingToast });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  if (type === 'banner') {
    return (
      <div className="absolute inset-0 group">
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt="Channel banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <div className="relative z-10 flex flex-col items-center gap-2 text-white/80">
              <FaCamera className="text-4xl" />
              <span className="text-sm font-medium tracking-wide uppercase">Channel Banner</span>
            </div>
          </div>
        )}

        <label
          htmlFor="banner-upload"
          className={`absolute inset-0 flex items-center justify-center bg-black/40 ${isUploading ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300 cursor-pointer backdrop-blur-sm`}
        >
          <div className="flex items-center gap-2 bg-white/95 text-gray-800 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            {isUploading ? (
              <>
                <FaSpinner className="animate-spin text-orange-500" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FaCamera className="text-orange-500" />
                <span>Change banner</span>
              </>
            )}
          </div>
        </label>
        <input
          id="banner-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </div>
    );
  }

  // Channel Picture (Avatar)
  return (
    <div className="relative group flex-shrink-0">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-orange-500 to-amber-500 overflow-hidden">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={channelName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl">
            {channelName?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <label
        htmlFor="picture-upload"
        className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 ${isUploading ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 group-hover:opacity-100'} transition-all duration-200 cursor-pointer backdrop-blur-sm`}
      >
        {isUploading ? (
          <FaSpinner className="animate-spin text-white text-lg" />
        ) : (
          <FaCamera className="text-white text-lg" />
        )}
      </label>
      <input
        id="picture-upload"
        type="file"
        accept="image/png"
        className="hidden"
        onChange={handleUpload}
        disabled={isUploading}
      />
    </div>
  );
}
