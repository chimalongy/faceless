'use client';

import { createChannel } from '../../../../lib/actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { FaArrowLeft, FaSpinner, FaTv, FaPlus, FaMicrophone } from 'react-icons/fa';

const ENGLISH_VOICES = {
  "🇺🇸 American Female": [
    { id: "af_heart",   label: "Heart",   grade: "A"  },
    { id: "af_bella",   label: "Bella",   grade: "A-" },
    { id: "af_nicole",  label: "Nicole",  grade: "B-" },
    { id: "af_aoede",   label: "Aoede",   grade: "C+" },
    { id: "af_kore",    label: "Kore",    grade: "C+" },
    { id: "af_sarah",   label: "Sarah",   grade: "C+" },
    { id: "af_alloy",   label: "Alloy",   grade: "C"  },
    { id: "af_nova",    label: "Nova",    grade: "C"  },
    { id: "af_jessica", label: "Jessica", grade: "D"  },
    { id: "af_river",   label: "River",   grade: "D"  },
    { id: "af_sky",     label: "Sky",     grade: "C-" },
  ],
  "🇺🇸 American Male": [
    { id: "am_fenrir",  label: "Fenrir",  grade: "C+" },
    { id: "am_michael", label: "Michael", grade: "C+" },
    { id: "am_puck",    label: "Puck",    grade: "C+" },
    { id: "am_echo",    label: "Echo",    grade: "D"  },
    { id: "am_eric",    label: "Eric",    grade: "D"  },
    { id: "am_liam",    label: "Liam",    grade: "D"  },
    { id: "am_onyx",    label: "Onyx",    grade: "D"  },
    { id: "am_santa",   label: "Santa",   grade: "D-" },
    { id: "am_adam",    label: "Adam",    grade: "F+" },
  ],
  "🇬🇧 British Female": [
    { id: "bf_emma",     label: "Emma",     grade: "B-" },
    { id: "bf_isabella", label: "Isabella", grade: "C"  },
    { id: "bf_alice",    label: "Alice",    grade: "D"  },
    { id: "bf_lily",     label: "Lily",     grade: "D"  },
  ],
  "🇬🇧 British Male": [
    { id: "bm_fable",  label: "Fable",  grade: "C"  },
    { id: "bm_george", label: "George", grade: "C"  },
    { id: "bm_lewis",  label: "Lewis",  grade: "D+" },
    { id: "bm_daniel", label: "Daniel", grade: "D"  },
  ],
};

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

          {/* Content Theme */}
          <div className="space-y-2.5">
            <label
              htmlFor="content_theme"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Content Theme
            </label>
            <p className="text-[12px] text-stone-400 -mt-1">
              The style and role of the AI narrator for this channel.
            </p>
            <div className="relative">
              <select
                id="content_theme"
                name="content_theme"
                required
                defaultValue=""
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a content theme...</option>
                <option value="story_teller">🎭 Story Teller</option>
                <option value="teacher">📚 Teacher</option>
                <option value="narrator">🎙️ Narrator</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Narrator Voice */}
          <div className="space-y-2.5">
            <label
              htmlFor="narrator_voice"
              className="block text-[13px] font-semibold text-stone-700 tracking-tight"
            >
              Narrator Voice
            </label>
            <p className="text-[12px] text-stone-400 -mt-1">
              The voice used to narrate content on this channel.
            </p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaMicrophone className="text-gray-300 text-sm" />
              </div>
              <select
                id="narrator_voice"
                name="narrator_voice"
                required
                defaultValue=""
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a narrator voice...</option>
                {Object.entries(ENGLISH_VOICES).map(([group, voices]) => (
                  <optgroup key={group} label={group}>
                    {voices.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.label} · {v.grade}
                      </option>
                    ))}
                  </optgroup>
                ))}
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