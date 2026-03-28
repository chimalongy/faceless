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
            className="ml-auto"
            onSubmit={handleSubmit}
        >
            <input type="hidden" name="topicId" value={topicId} />
            <input type="hidden" name="channelId" value={channelId} />
            <input type="hidden" name="channel_type" value={channelType || ''} />
            <input type="hidden" name="confirm" value="yes" />
            <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                aria-label="Delete topic"
            >
                <FaTrash className="text-[10px]" />
                <span className="hidden sm:inline">Delete</span>
            </button>
        </form>
    );
}
