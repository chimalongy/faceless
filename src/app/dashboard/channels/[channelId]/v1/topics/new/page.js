'use client';

import { createTopic } from '../../../../../../../lib/actions';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { getChannel } from '../../../../../../../lib/actions';
import { usePathname } from 'next/navigation';
import { get_channel_type } from '../../../../../../client_lib';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full md:w-auto px-8"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <FaSpinner className="animate-spin" /> Creating...
        </span>
      ) : (
        'Create Topic'
      )}
    </button>
  );
}

export default function NewTopicPage() {
  const params = useParams();
  const channelId = params.channelId;
  let path = usePathname()
  let channel_type = get_channel_type(channelId, path)









  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/dashboard/channels/${channelId}/${channel_type}`} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-6">
        <FaArrowLeft /> Back to Channel
      </Link>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
          Create New Topic
        </h1>
        <p className="text-gray-500 mt-1">Organize your content ideas under a specific topic.</p>
      </div>

      <div className="glass-panel p-8 rounded-xl border border-orange-100 shadow-sm">
        <form action={createTopic} className="space-y-6">
          <input type="hidden" name="channelId" value={channelId} />

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Topic Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g. Ancient History"
              className="input-field"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="What kind of stories will go here?"
              className="input-field resize-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="background_music_prompt" className="text-sm font-medium text-gray-700">
              Background Music Prompt (Optional)
            </label>
            <textarea
              id="background_music_prompt"
              name="background_music_prompt"
              rows={2}
              placeholder="e.g. Ambient electronic background music"
              className="input-field resize-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image_generation_theme" className="text-sm font-medium text-gray-700">
              Image Generation Theme (Optional)
            </label>
            <textarea
              id="image_generation_theme"
              name="image_generation_theme"
              rows={2}
              placeholder="e.g. Cinematic lighting, photorealistic"
              className="input-field resize-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
