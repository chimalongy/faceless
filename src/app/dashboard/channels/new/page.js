// src/app/dashboard/channels/new/page.js
'use client';

import { createChannel } from '../../../../lib/actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { FaArrowLeft, FaSpinner, FaTv, FaPlus } from 'react-icons/fa';

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
          <span>Creating...</span>
        </>
      ) : (
        <>
          <FaPlus className="text-xs" />
          <span>Create Channel</span>
        </>
      )}
    </button>
  );
}

export default function NewChannelPage() {
  return (
    <div className="space-y-8 pb-10 px-2 max-w-2xl">

      {/* ── PAGE HEADER ── */}
      <div>
        <Link
          href="/dashboard/channels"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-400 hover:text-orange-500 transition-colors mb-4 no-underline"
        >
          <FaArrowLeft className="text-xs" />
          Back to Channels
        </Link>

        <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
          New Channel
        </p>
        <h1
          className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Create Channel
        </h1>
        <p className="text-[15px] text-stone-400 mt-1">
          Add a new YouTube channel to your workspace.
        </p>
      </div>

      {/* ── FORM CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <form action={createChannel} className="space-y-6">
          {/* Channel Name */}
          <div className="space-y-2.5">
            <label
              htmlFor="name"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Channel Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaTv className="text-gray-300 text-sm" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. Daily Facts"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>
          </div>

          {/* Channel Type */}
          <div className="space-y-2.5">
            <label
              htmlFor="channel_type"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Channel Type
            </label>
            <div className="relative">
              <select
                id="channel_type"
                name="channel_type"
                required
                defaultValue="v1"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all appearance-none cursor-pointer"
              >
                <option value="v1">V1</option>
                <option value="v2">V2</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2.5">
            <label
              htmlFor="description"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="What is this channel about?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <Link
              href="/dashboard/channels"
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