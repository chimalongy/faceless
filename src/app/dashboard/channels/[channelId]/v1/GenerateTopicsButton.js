'use client';

import { useState } from 'react';
import { FaRobot, FaTimes, FaMinus, FaPlus, FaMagic } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function GenerateTopicsButton({ channelId }) {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [count, setCount] = useState(5);

    const handleOpen = () => {
        setCount(5);
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
                toast.success(`✅ Generating ${count} topic${count !== 1 ? 's' : ''} in the background!`, { id: t });
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
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                className="btn-primary px-6 py-2 w-auto inline-flex gap-2 items-center"
            >
                <FaRobot />
                Generate Topics
            </button>

            {/* Modal Overlay */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl border border-orange-100 p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                        >
                            <FaTimes className="text-sm" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                                <FaMagic className="text-white text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Generate AI Topics</h2>
                                <p className="text-sm text-gray-500">How many topics should we create?</p>
                            </div>
                        </div>

                        {/* Count Picker */}
                        <div className="flex items-center justify-center gap-6 py-6">
                            <button
                                onClick={() => setCount(c => Math.max(1, c - 1))}
                                disabled={count <= 1}
                                className="w-12 h-12 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
                            >
                                <FaMinus />
                            </button>

                            <div className="flex flex-col items-center gap-1">
                                <span className="text-5xl font-extrabold text-gray-900 w-16 text-center tabular-nums">
                                    {count}
                                </span>
                                <span className="text-sm text-gray-400">topic{count !== 1 ? 's' : ''}</span>
                            </div>

                            <button
                                onClick={() => setCount(c => Math.min(20, c + 1))}
                                disabled={count >= 20}
                                className="w-12 h-12 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
                            >
                                <FaPlus />
                            </button>
                        </div>

                        {/* Quick picks */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[3, 5, 10, 15].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setCount(n)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${count === n
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                                        }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <FaRobot className={loading ? 'animate-spin' : ''} />
                                {loading ? 'Starting…' : `Generate ${count}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
