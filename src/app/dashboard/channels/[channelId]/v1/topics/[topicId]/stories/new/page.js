// src/app/dashboard/channels/[channelId]/[channelType]/topics/[topicId]/stories/new/page.js
'use client';

import { createStory } from "../../../../../../../../../lib/actions";
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import {
  FaArrowLeft,
  FaSpinner,
  FaCloudUploadAlt,
  FaMagic,
  FaPlus,
  FaMobileAlt,
  FaYoutube,
  FaInstagram,
  FaImage,
  FaHeading,
  FaAlignLeft,
} from 'react-icons/fa';
import { get_channel_type } from "../../../../../../../../client_lib";
import axios from "axios";

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
          <span>Create Story</span>
        </>
      )}
    </button>
  );
}

const platformOptions = [
  {
    value: 'tiktok',
    label: 'TikTok / Reels / Shorts',
    aspect: '9:16',
    icon: <FaMobileAlt className="text-sm" />,
  },
  {
    value: 'youtube',
    label: 'YouTube',
    aspect: '16:9',
    icon: <FaYoutube className="text-sm" />,
  },
  {
    value: 'instagram_square',
    label: 'Instagram Square',
    aspect: '1:1',
    icon: <FaInstagram className="text-sm" />,
  },
];

export default function NewStoryPage() {
  const params = useParams();
  const { channelId, topicId } = params;
  const pathname = usePathname();
  const channel_type = get_channel_type(channelId, pathname);

  const [previews, setPreviews] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('tiktok');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPreviews(newPreviews);
  };

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
          Draft your story and upload visuals.
        </p>
      </div>

      {/* ── FORM CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <form action={createStory} className="space-y-8">
          <input type="hidden" name="channelId" value={channelId} />
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="channel_type" value={channel_type} />
          <input type="hidden" name="social_media_target" value={selectedPlatform} />

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

          {/* Story Content */}
          <div className="space-y-2.5">
            <label
              htmlFor="content"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Story Content / Notes
            </label>
            <div className="relative">
              <div className="absolute top-3 left-4 pointer-events-none">
                <FaAlignLeft className="text-gray-300 text-sm" />
              </div>
              <textarea
                id="content"
                name="content"
                rows={8}
                placeholder="Write your story draft here or paste your research notes..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2.5">
            <label className="block text-[13px] font-semibold text-stone-700 tracking-tight">
              Social Media Target
            </label>
            <div className="space-y-2">
              {platformOptions.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selectedPlatform === platform.value
                    ? 'border-orange-300 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-stone-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <span
                    className={`${selectedPlatform === platform.value
                      ? 'text-orange-500'
                      : 'text-gray-400'
                      }`}
                  >
                    {platform.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold block truncate">
                      {platform.label}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${selectedPlatform === platform.value
                      ? 'bg-orange-200 text-orange-700'
                      : 'bg-gray-100 text-gray-500'
                      }`}
                  >
                    {platform.aspect}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2.5">
            <label className="block text-[13px] font-semibold text-stone-700 tracking-tight">
              Story Images
            </label>

            <div className="border-2 border-dashed border-orange-200 rounded-2xl p-8 text-center hover:border-orange-400 transition-colors bg-orange-50/30">
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <FaCloudUploadAlt className="text-2xl text-orange-500" />
                </div>
                <div>
                  <span className="text-stone-700 font-semibold text-[14px] block">
                    Click to upload images
                  </span>
                  <span className="text-stone-400 text-[13px] mt-1 block">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </span>
                </div>
              </label>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {previews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                  >
                    <img
                      src={preview.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-[13px] text-stone-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <FaMagic className="text-purple-500 text-xs" />
              <span>AI Image Generation coming soon...</span>
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