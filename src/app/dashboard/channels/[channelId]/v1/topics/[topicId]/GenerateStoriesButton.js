'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import GenerateStoriesModal from './GenerateStoriesModal';

export default function GenerateStoriesButton({ topicId, channelId }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium transition-all shadow-lg shadow-emerald-500/25"
            >
                <FaMagic />
                Generate Stories
            </button>

            <GenerateStoriesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                topicId={topicId}
                channelId={channelId}
            />
        </>
    );
}
