'use client';

import { useState } from 'react';
import { FaVideo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Modal from '../ui/Modal';

export default function GenerateSceneFrameVideoButton({ storyId, sceneNumber, sceneTitle, isEnabled }) {
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoGenUrl, setVideoGenUrl] = useState('');
    const [genMode, setGenMode] = useState('local'); // 'local' or 'external'
    const router = useRouter();

    const handleGenerate = async () => {
        if (genMode === 'external' && !videoGenUrl.trim()) {
            toast.error('External service URL is required');
            return;
        }

        setIsModalOpen(false);
        setLoading(true);
        const loadingToast = toast.loading(`Generating video for ${sceneTitle || `Scene ${sceneNumber}`}...`);

        try {
            const res = await fetch('/api/generate/scene-frames/generate-frame-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ storyId, sceneNumber, videoGenUrl: genMode === 'local' ? '' : videoGenUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Scene frame generation failed');
            }

            toast.success('Scene frame generation triggered!', { id: loadingToast });
            router.refresh();
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        } finally {
            setLoading(false);
            setVideoGenUrl('');
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={loading || !isEnabled}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-xs rounded-xl hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all shadow-md shadow-violet-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                <FaVideo className="text-[10px]" />
                <span>{loading ? 'Generating...' : 'Generate Frame Video'}</span>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Scene Video Generation"
            >
                <div className="space-y-5">
                    {/* Select Mode */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                            Rendering Mode
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setGenMode('local')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                    genMode === 'local'
                                        ? 'border-violet-500 bg-violet-50/50 text-violet-700 shadow-sm'
                                        : 'border-stone-100 hover:border-stone-200 text-stone-600'
                                }`}
                            >
                                <span className="text-xs font-semibold">Direct Rendering</span>
                                <span className="text-[10px] text-stone-400 mt-0.5">FFmpeg on server</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setGenMode('external')}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                    genMode === 'external'
                                        ? 'border-violet-500 bg-violet-50/50 text-violet-700 shadow-sm'
                                        : 'border-stone-100 hover:border-stone-200 text-stone-600'
                                }`}
                            >
                                <span className="text-xs font-semibold">External Service</span>
                                <span className="text-[10px] text-stone-400 mt-0.5">Custom URL</span>
                            </button>
                        </div>
                    </div>

                    {genMode === 'external' && (
                        <div className="space-y-2">
                            <p className="text-xs text-stone-600">
                                Please provide the video generation service URL for {sceneTitle || `Scene ${sceneNumber}`}.
                            </p>
                            <input
                                type="url"
                                value={videoGenUrl}
                                onChange={(e) => setVideoGenUrl(e.target.value)}
                                placeholder="https://your-generation-api.com"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                autoFocus
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm shadow-md shadow-violet-500/20"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}