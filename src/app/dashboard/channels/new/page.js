'use client';

import { createChannel } from '../../../../lib/actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';

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
        'Create Channel'
      )}
    </button>
  );
}

export default function NewChannelPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/channels"
        className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-6"
      >
        <FaArrowLeft /> Back to Channels
      </Link>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
          Create New Channel
        </h1>
        <p className="text-gray-500 mt-1">
          Add a new YouTube channel to your workspace.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-xl border border-orange-100 shadow-sm">
        <form action={createChannel} className="space-y-6">
          {/* Channel Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Channel Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g. Daily Facts"
              className="input-field"
            />
          </div>

          {/* Channel Type */}
          <div className="space-y-2">
            <label htmlFor="channel_type" className="text-sm font-medium text-gray-700">
              Channel Type
            </label>
            <select
              id="channel_type"
              name="channel_type"
              required
              defaultValue="v1"
              className="input-field bg-white"
            >
              <option value="v1">V1</option>
              <option value="v2">V2</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="What is this channel about?"
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
