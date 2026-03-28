'use client';

import { useState } from 'react';
import { FaMagic, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function GenerateMusicButton({ topicId }) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const t = toast.loading('Queuing music generation…');
        try {
            const res = await fetch('/api/generate/audio/generate-music', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topicId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to start');

            toast.success('🎵 Music generation started in the background!', { id: t });
        } catch (err) {
            toast.error(err.message || 'Failed to start music generation', { id: t });
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {loading ? (
                <FaSpinner className="animate-spin" />
            ) : (
                <FaMagic />
            )}
            {loading ? 'Starting…' : 'Generate with AI'}
        </button>
    );
}
