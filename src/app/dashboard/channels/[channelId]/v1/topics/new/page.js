// src/app/dashboard/channels/[channelId]/[channelType]/topics/new/page.js
'use client';

import { createTopic } from '../../../../../../../lib/actions';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import {
  FaArrowLeft,
  FaSpinner,
  FaPlus,
  FaLayerGroup,
  FaMusic,
  FaImage,
} from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { get_channel_type } from '../../../../../../client_lib';

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
          <span>Create Topic</span>
        </>
      )}
    </button>
  );
}

export default function NewTopicPage() {
  const params = useParams();
  const channelId = params.channelId;
  const path = usePathname();
  const channel_type = get_channel_type(channelId, path);

  const formFields = [
    {
      id: 'name',
      name: 'name',
      label: 'Topic Name',
      required: true,
      placeholder: 'e.g. Ancient History',
      icon: <FaLayerGroup className="text-gray-300 text-sm" />,
      type: 'text',
      rows: null,
    },
    {
      id: 'description',
      name: 'description',
      label: 'Description',
      required: false,
      placeholder: 'What kind of stories will go here?',
      icon: null,
      type: 'textarea',
      rows: 5,
    },
    {
      id: 'background_music_prompt',
      name: 'background_music_prompt',
      label: 'Background Music Prompt',
      required: false,
      placeholder: 'e.g. Ambient electronic background music',
      icon: <FaMusic className="text-gray-300 text-sm" />,
      type: 'textarea',
      rows: 2,
      optional: true,
    },
    {
      id: 'image_generation_theme',
      name: 'image_generation_theme',
      label: 'Image Generation Theme',
      required: false,
      placeholder: 'e.g. Cinematic lighting, photorealistic',
      icon: <FaImage className="text-gray-300 text-sm" />,
      type: 'textarea',
      rows: 2,
      optional: true,
    },
  ];

  return (
    <div className="space-y-8 pb-10 px-2 max-w-2xl">

      {/* ── PAGE HEADER ── */}
      <div>
        <Link
          href={`/dashboard/channels/${channelId}/${channel_type}`}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-400 hover:text-orange-500 transition-colors mb-4 no-underline"
        >
          <FaArrowLeft className="text-xs" />
          Back to Channel
        </Link>

        <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
          New Topic
        </p>
        <h1
          className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Create Topic
        </h1>
        <p className="text-[15px] text-stone-400 mt-1">
          Organize your content ideas under a specific topic.
        </p>
      </div>

      {/* ── FORM CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <form action={createTopic} className="space-y-6">
          <input type="hidden" name="channelId" value={channelId} />

          {formFields.map((field) => (
            <div key={field.id} className="space-y-2.5">
              <label
                htmlFor={field.id}
                className="block text-[13px] font-semibold text-stone-700 tracking-tight"
              >
                {field.label}
                {field.optional && (
                  <span className="ml-1.5 text-[11px] font-medium text-gray-400">
                    Optional
                  </span>
                )}
              </label>
              <div className="relative">
                {field.icon && (
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {field.icon}
                  </div>
                )}
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    name={field.name}
                    rows={field.rows}
                    placeholder={field.placeholder}
                    className={`w-full ${field.icon ? 'pl-11' : 'px-4'
                      } pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none`}
                  />
                ) : (
                  <input
                    type="text"
                    id={field.id}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    className={`w-full ${field.icon ? 'pl-11' : 'px-4'
                      } pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all`}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <Link
              href={`/dashboard/channels/${channelId}/${channel_type}`}
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