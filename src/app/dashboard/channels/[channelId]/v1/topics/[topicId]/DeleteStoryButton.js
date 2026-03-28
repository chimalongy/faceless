'use client';

import { FaTrash } from 'react-icons/fa';
import { deleteStory } from '../../../../../../../lib/actions';

export default function DeleteStoryButton({ storyId, topicId, channelId, channelType }) {
    const handleSubmit = (e) => {
        if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
            e.preventDefault();
        }
    };

    return (
        <form
            action={deleteStory}
            onSubmit={handleSubmit}
        >
            <input type="hidden" name="storyId" value={storyId} />
            <input type="hidden" name="topicId" value={topicId} />
            <input type="hidden" name="channelId" value={channelId} />
            <input type="hidden" name="channel_type" value={channelType} />
            <input type="hidden" name="confirm" value="yes" />
            <button
                type="submit"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm"
                aria-label="Delete story"
            >
                <FaTrash className="text-xs" />
            </button>
        </form>
    );
}
