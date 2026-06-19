// src/app/dashboard/channels/[channelId]/[channelType]/topics/[topicId]/stories/new/page.js
'use client';

import { createStory } from "../../../../../../../../../lib/actions";
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import {
  FaArrowLeft,
  FaSpinner,
  FaPlus,
  FaHeading,
  FaAlignLeft,
} from 'react-icons/fa';
import { get_channel_type } from "../../../../../../../../client_lib";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-7 py-3 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed w-full sm:w-auto"
    >
      {pending ? (
        <>
          <FaSpinner className="animate-spin text-xs" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <FaPlus className="text-xs" />
          <span>Create Story</span>
        </>
      )}
    </button>
  );
}

export default function NewStoryPage() {
  const params = useParams();
  const { channelId, topicId } = params;
  const pathname = usePathname();
  const channel_type = get_channel_type(channelId, pathname);

  return (
    <div className="space-y-8 pb-10 px-2 max-w-3xl">

      {/* ── PAGE HEADER ── */}
      <div>
        <Link
          href={`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}`}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-400 hover:text-orange-500 transition-colors mb-4 no-underline"
        >
          <FaArrowLeft className="text-xs" />
          Back to Topic
        </Link>

        <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
          New Story
        </p>
        <h1
          className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Create Story
        </h1>
        <p className="text-[15px] text-stone-400 mt-1">
          Provide a title and a description to generate your story content.
        </p>
      </div>

      {/* ── FORM CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <form action={createStory} className="space-y-8">
          <input type="hidden" name="channelId" value={channelId} />
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="channel_type" value={channel_type} />

          {/* Story Title */}
          <div className="space-y-2.5">
            <label
              htmlFor="title"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Story Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaHeading className="text-gray-300 text-sm" />
              </div>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="e.g. The Mystery of the Pyramids"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>
          </div>

          {/* Story Description / Prompt */}
          <div className="space-y-2.5">
            <label
              htmlFor="description"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Description of what story is to be generated
            </label>
            <div className="relative">
              <div className="absolute top-3 left-4 pointer-events-none">
                <FaAlignLeft className="text-gray-300 text-sm" />
              </div>
              <textarea
                id="description"
                name="description"
                required
                rows={8}
                placeholder="Describe what story/content you want to generate. Be as detailed as you like..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}`}
              className="inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-stone-500 px-5 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all no-underline order-2 sm:order-1"
            >
              Cancel
            </Link>
            <div className="order-1 sm:order-2">
              <SubmitButton />
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}