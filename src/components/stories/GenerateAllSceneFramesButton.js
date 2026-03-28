'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Modal from '../ui/Modal';

export default function GenerateAllSceneFramesButton({ storyId }) {
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoGenUrl, setVideoGenUrl] = useState('');
    const router = useRouter();

    const handleGenerate = async () => {
        if (!storyId) {
            toast.error('Story ID is required');
            return;
        }

        setIsModalOpen(false);
        setLoading(true);
        const loadingToast = toast.loading('Generating scene frames...');

        try {
            const res = await fetch('/api/generate/scene-frames/generate-story_videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ storyId, videoGenUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Scene frames generation failed');
            }

            toast.success('Scene frames generated successfully!', { id: loadingToast });
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
                disabled={loading}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
                <FaMagic className="group-hover:scale-110 transition-transform" />
                <span>{loading ? 'Generating…' : 'Generate All'}</span>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Video Generation Link"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide the video generation service URL.
                    </p>
                    <input
                        type="url"
                        value={videoGenUrl}
                        onChange={(e) => setVideoGenUrl(e.target.value)}
                        placeholder="https://your-generation-api.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="px-6 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
