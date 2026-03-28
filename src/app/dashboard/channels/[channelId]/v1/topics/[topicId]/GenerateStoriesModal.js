'use client';

import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function GenerateStoriesModal({ isOpen, onClose, topicId, channelId }) {
    const [storyCount, setStoryCount] = useState(5);
    const [socialMediaTarget, setSocialMediaTarget] = useState('tiktok');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (storyCount < 1 || storyCount > 20) {
            alert('Please enter a number between 1 and 20');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/generate/generate-stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicId,
                    channelId,
                    storyCount: parseInt(storyCount),
                    socialMediaTarget
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Started generating ${storyCount} stories!`);
                onClose();
                // Optional: Refresh the page to see new stories
                window.location.reload();
            } else {
                alert(`❌ Error: ${data.error || 'Failed to generate stories'}`);
            }
        } catch (error) {
            console.error('Generate stories error:', error);
            alert('❌ Error: Failed to generate stories');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Generate Stories
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={loading}
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label
                                htmlFor="storyCount"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                How many stories do you want to generate?
                            </label>
                            <input
                                type="number"
                                id="storyCount"
                                min="1"
                                max="20"
                                value={storyCount}
                                onChange={(e) => setStoryCount(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                disabled={loading}
                                required
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Enter a number between 1 and 20
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="socialMediaTarget"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Social Media Target
                            </label>
                            <select
                                id="socialMediaTarget"
                                value={socialMediaTarget}
                                onChange={(e) => setSocialMediaTarget(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                disabled={loading}
                            >
                                <option value="tiktok">TikTok / Reels / Shorts (9:16)</option>
                                <option value="youtube">YouTube (16:9)</option>
                                <option value="instagram_square">Instagram Square (1:1)</option>
                            </select>
                        </div>


                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Generating...' : 'Proceed'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
