'use client';

import { FaTrash } from 'react-icons/fa';
import { deleteTopic } from '../../../../../lib/actions';

export default function DeleteTopicButton({ topicId, channelId, channelType }) {
    const handleSubmit = (e) => {
        if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
            e.preventDefault();
        }
    };

    return (
        <form
            action={deleteTopic}
            onSubmit={handleSubmit}
        >
            <input type="hidden" name="topicId" value={topicId} />
            <input type="hidden" name="channelId" value={channelId} />
            <input type="hidden" name="channel_type" value={channelType || ''} />
            <input type="hidden" name="confirm" value="yes" />
            <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-white hover:bg-red-500 px-3 py-2 rounded-xl border border-red-200 hover:border-red-500 hover:shadow-md hover:shadow-red-500/20 active:scale-95 transition-all duration-200"
                aria-label="Delete topic"
            >
                <FaTrash className="text-[11px]" />
                <span className="hidden sm:inline">Delete</span>
            </button>
        </form>
    );
}