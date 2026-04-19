'use client';

import { useState } from 'react';
import { FaYoutube, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function UploadToYoutubeButton({ storyId }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    const t = toast.loading('Queuing YouTube upload…');

    try {
      const res = await fetch('/api/generate/upload-to-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start upload');
      }

      // Check if OAuth is required before proceeding
      if (data.requiresAuth) {
        toast.loading('Redirecting to YouTube Authorization...', { id: t });
        window.location.href = data.authUrl;
        return;
      }

      toast.success('🎥 YouTube upload task started! Check logs for details.', { id: t });
    } catch (err) {
      console.error('YouTube upload error:', err);
      toast.error(err.message || 'Failed to start YouTube upload', { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpload}
      disabled={loading}
      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
    >
      {loading ? (
        <FaSpinner className="animate-spin text-lg" />
      ) : (
        <FaYoutube className="text-xl group-hover:scale-110 transition-transform" />
      )}
      <span>{loading ? 'Queuing…' : 'Upload to YouTube'}</span>
    </button>
  );
}
