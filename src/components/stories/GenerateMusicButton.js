'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function GenerateMusicButton({ topicId }) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const t = toast.loading('Queuing music generation…');
        try {
            const res = await fetch('/api/generate/topic-background-music', {
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 text-white font-semibold text-sm shadow-md shadow-purple-500/20 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <FaMagic className="text-xs" />
            )}
            {loading ? 'Starting…' : 'Generate with AI'}
        </button>
    );
}