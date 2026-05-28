'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function GenerateAllImagesButton({ storyId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!storyId) {
      toast.error('Story ID is required');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Generating images from script...');

    try {
      const res = await fetch('/api/generate/image/generate-all-scene-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      toast.success('Images generated successfully!', { id: loadingToast });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm rounded-xl hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <FaMagic className="text-xs" />
      <span>{loading ? 'Generating…' : 'Generate All'}</span>
    </button>
  );
}