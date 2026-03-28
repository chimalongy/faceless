'use client';

import { useState } from 'react';
import { FaVideo, FaPlay } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function MergeVideosButton({ storyId, isEnabled }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleMerge = async () => {
        if (!storyId) {
            toast.error('Story ID is required');
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading('Starting video merge process...');

        try {
            const res = await fetch('/api/generate/merge-frames', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ storyId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Merge process failed');
            }

            toast.success('Merge process triggered successfully!', { id: loadingToast });
            router.refresh();
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-100">
            <button
                type="button"
                onClick={handleMerge}
                disabled={loading || !isEnabled}
                className={`group relative overflow-hidden inline-flex items-center justify-center gap-3 w-full px-8 py-4 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:scale-100
                    ${isEnabled
                        ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:shadow-violet-500/25'
                        : 'bg-gray-400'
                    }`}
            >
                {/* Decorative glow effect */}
                {isEnabled && !loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                )}

                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <FaPlay className="text-lg group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-lg">
                        {loading ? 'Processing Merge...' : 'Merge All Scene Videos'}
                    </span>
                </div>

                {!isEnabled && !loading && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-800">
                        Generate all scene videos first
                    </div>
                )}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500 font-medium">
                Combine all generated scenes into a single high-quality video file
            </p>

            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
