// src/app/dashboard/channels/[channelId]/[channelType]/topics/[topicId]/GenerateStoriesModal.js
'use client';

import { useState } from 'react';
import {
    FaTimes,
    FaRobot,
    FaPlus,
    FaMinus,
    FaSpinner,
    FaMobileAlt,
    FaYoutube,
    FaInstagram,
} from 'react-icons/fa';

const platformOptions = [
    {
        value: 'tiktok',
        label: 'TikTok / Reels / Shorts',
        aspect: '9:16',
        icon: <FaMobileAlt className="text-sm" />,
    },
    {
        value: 'youtube',
        label: 'YouTube',
        aspect: '16:9',
        icon: <FaYoutube className="text-sm" />,
    },
    {
        value: 'instagram_square',
        label: 'Instagram Square',
        aspect: '1:1',
        icon: <FaInstagram className="text-sm" />,
    },
];

export default function GenerateStoriesModal({ isOpen, onClose, topicId, channelId }) {
    const [storyCount, setStoryCount] = useState(1);
    const [socialMediaTarget, setSocialMediaTarget] = useState('tiktok');
    const [ loading, setLoading] = useState(false);

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
                    socialMediaTarget,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Started generating ${storyCount} stories!`);
                onClose();
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── HEADER ── */}
                <div className="px-6 pt-6 pb-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="text-xs" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                            <FaRobot className="text-white text-sm" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase">
                                AI Generator
                            </p>
                            <h2
                                className="text-[18px] font-extrabold text-stone-900 tracking-tight"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                Generate Stories
                            </h2>
                        </div>
                    </div>
                </div>

                {/* ── FORM ── */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
                    {/* Story Count */}
                    <div className="bg-gray-50/50 rounded-2xl p-5">
                        <p className="text-[13px] text-stone-400 text-center mb-4">
                            How many stories should we create?
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => setStoryCount((c) => Math.max(1, c - 1))}
                                disabled={storyCount <= 1 || loading}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-stone-600 hover:border-orange-300 hover:text-orange-500 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                            >
                                <FaMinus className="text-xs" />
                            </button>

                            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
                                <span
                                    className="text-[32px] font-extrabold text-stone-900 text-center tabular-nums leading-none"
                                    style={{ fontFamily: "'Syne', sans-serif" }}
                                >
                                    {storyCount}
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium">
                                    story{storyCount !== 1 ? 'ies' : 'y'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStoryCount((c) => Math.min(20, c + 1))}
                                disabled={storyCount >= 20 || loading}
                                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-stone-600 hover:border-orange-300 hover:text-orange-500 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                            >
                                <FaPlus className="text-xs" />
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-4">
                            {[3, 5, 10, 15].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setStoryCount(n)}
                                    disabled={loading}
                                    className={`px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${storyCount === n
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                                            : 'bg-white text-stone-500 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                                        } disabled:opacity-50`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Platform Selection */}
                    <div className="space-y-2.5">
                        <label className="block text-[13px] font-semibold text-stone-700 tracking-tight">
                            Platform
                        </label>
                        <div className="space-y-2">
                            {platformOptions.map((platform) => (
                                <button
                                    key={platform.value}
                                    type="button"
                                    onClick={() => setSocialMediaTarget(platform.value)}
                                    disabled={loading}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${socialMediaTarget === platform.value
                                            ? 'border-orange-300 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 bg-white text-stone-600 hover:border-gray-300 hover:bg-gray-50'
                                        } disabled:opacity-50`}
                                >
                                    <span
                                        className={`${socialMediaTarget === platform.value
                                                ? 'text-orange-500'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        {platform.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13px] font-semibold block truncate">
                                            {platform.label}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${socialMediaTarget === platform.value
                                                ? 'bg-orange-200 text-orange-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {platform.aspect}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-stone-500 hover:bg-gray-50 text-[13px] font-semibold transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin text-xs" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <FaRobot className="text-xs" />
                                    <span>Generate {storyCount}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}