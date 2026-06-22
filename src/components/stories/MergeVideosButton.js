'use client';

import { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function MergeVideosButton({ storyId, isEnabled, isMerging }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const isCurrentlyMerging = loading || isMerging;

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
        <div className="text-center">
            <button
                type="button"
                onClick={handleMerge}
                disabled={isCurrentlyMerging || !isEnabled}
                className={`group relative overflow-hidden inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale disabled:scale-100 text-sm
                    ${isEnabled
                        ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 hover:opacity-90 hover:-translate-y-px'
                        : 'bg-gray-200 text-gray-400'
                    }`}
            >
                {isCurrentlyMerging ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <FaPlay className="text-sm" />
                )}
                <span>
                    {isCurrentlyMerging ? 'Processing Merge...' : 'Merge All Scene Videos'}
                </span>

                {!isEnabled && !isCurrentlyMerging && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Generate all scene videos first
                    </div>
                )}
            </button>

            <p className="mt-3 text-center text-xs text-stone-400 font-medium">
                Combine all generated scenes into a single high-quality video file
            </p>
        </div>
    );
}