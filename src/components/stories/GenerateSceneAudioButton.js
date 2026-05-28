'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function GenerateSceneAudioButton({ storyId, sceneNumber, sceneTitle }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    const loadingToast = toast.loading(`Generating audio for Scene ${sceneNumber}...`);

    try {
      const payload = {
        storyId,
        sceneNumber,
      };

      const res = await fetch('/api/generate/audio/generate-scene-audio', {
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

      toast.success(`Audio for Scene ${sceneNumber} generated!`, { id: loadingToast });
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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold text-sm hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all shadow-md shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <FaMagic className={`text-xs ${loading ? 'animate-spin' : ''}`} />
      <span>{loading ? 'Generating...' : 'Generate Scene Audio'}</span>
    </button>
  );
}