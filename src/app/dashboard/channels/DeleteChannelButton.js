'use client';

import { FaTrash } from 'react-icons/fa';
import { deleteChannel } from '../../../lib/actions';

export default function DeleteChannelButton({ channelId }) {
    const handleSubmit = (e) => {
        if (!confirm('Are you sure you want to delete this channel? This will also delete all associated topics and stories.')) {
            e.preventDefault();
        }
    };

    return (
        <form
            action={deleteChannel}
            className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onSubmit={handleSubmit}
        >
            <input type="hidden" name="channelId" value={channelId} />
            <button
                type="submit"
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Channel"
            >
                <FaTrash />
            </button>
        </form>
    );
}
