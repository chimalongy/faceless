'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function GenerateAudioButton({ storyId, variant = 'primary', label = 'Generate from Script' }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Generating audio from script...');

    try {
      const payload = { storyId };

      const res = await fetch('/api/generate/audio/generate-script-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Audio generation failed');
      }

      toast.success('Audio generation completed!', { id: loadingToast });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = 'inline-flex items-center gap-2 rounded-xl font-semibold text-sm transition-all';
  const styles =
    variant === 'primary'
      ? 'px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0 shadow-md shadow-purple-500/20'
      : 'px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0 shadow-md shadow-purple-500/20';

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className={`${baseClasses} ${styles} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <FaMagic className="text-xs" />
      <span>{loading ? 'Generating…' : label}</span>
    </button>
  );
}