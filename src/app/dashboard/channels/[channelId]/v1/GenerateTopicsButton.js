// src/app/dashboard/channels/[channelId]/[channelType]/GenerateTopicsButton.js
'use client';

import { useState } from 'react';
import {
    FaRobot,
    FaTimes,
    FaMinus,
    FaPlus,
    FaMagic,
    FaSpinner,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function GenerateTopicsButton({ channelId }) {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [count, setCount] = useState(1);

    const handleOpen = () => {
        setCount(1);
        setShowModal(true);
    };

    const handleClose = () => {
        if (!loading) setShowModal(false);
    };

    const handleGenerate = async () => {
        setLoading(true);
        const t = toast.loading(`Queuing ${count} topic${count !== 1 ? 's' : ''}…`);
        try {
            const response = await fetch('/api/generate/generate-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId, count }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(
                    `✅ Generating ${count} topic${count !== 1 ? 's' : ''} in the background!`,
                    { id: t }
                );
                setShowModal(false);
            } else {
                toast.error(data.error || 'Failed to generate topics', { id: t });
            }
        } catch (error) {
            console.error('Generate topics error:', error);
            toast.error('Failed to start topic generation', { id: t });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* ── TRIGGER BUTTON ── */}
            <button
                onClick={handleOpen}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-stone-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-all no-underline active:scale-95"
            >
                <FaRobot className="text-xs text-orange-500" />
                <span>Generate</span>
            </button>

            {/* ── MODAL OVERLAY ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── MODAL HEADER ── */}
                        <div className="px-6 pt-6 pb-4">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes className="text-xs" />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                                    <FaMagic className="text-white text-sm" />
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase">
                                        AI Generator
                                    </p>
                                    <h2
                                        className="text-[18px] font-extrabold text-stone-900 tracking-tight"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        Generate Topics
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* ── COUNT PICKER ── */}
                        <div className="px-6 py-4 bg-gray-50/50">
                            <p className="text-[13px] text-stone-400 text-center mb-4">
                                How many topics should we create?
                            </p>

                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setCount((c) => Math.max(1, c - 1))}
                                    disabled={count <= 1 || loading}
                                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-stone-600 hover:border-orange-300 hover:text-orange-500 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <FaMinus className="text-xs" />
                                </button>

                                <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
                                    <span
                                        className="text-[32px] font-extrabold text-stone-900 text-center tabular-nums leading-none"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        {count}
                                    </span>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        topic{count !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setCount((c) => Math.min(20, c + 1))}
                                    disabled={count >= 20 || loading}
                                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-stone-600 hover:border-orange-300 hover:text-orange-500 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <FaPlus className="text-xs" />
                                </button>
                            </div>
                        </div>

                        {/* ── QUICK PICKS ── */}
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                                {[3, 5, 10, 15].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setCount(n)}
                                        disabled={loading}
                                        className={`px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${count === n
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                                            : 'bg-gray-50 text-stone-500 hover:bg-orange-50 hover:text-orange-600'
                                            } disabled:opacity-50`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── ACTIONS ── */}
                        <div className="px-6 pb-6 pt-2 flex gap-3">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-stone-500 hover:bg-gray-50 text-[13px] font-semibold transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="animate-spin text-xs" />
                                        <span>Starting…</span>
                                    </>
                                ) : (
                                    <>
                                        <FaRobot className="text-xs" />
                                        <span>Generate {count}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}