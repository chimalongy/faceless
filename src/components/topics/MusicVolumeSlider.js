'use client';

import { useState, useTransition, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute, FaVolumeDown, FaCheck, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateMusicVolume } from '../../lib/actions';

// Volume stored as 0.0–1.0 in DB; slider operates in 0–100 integers
export default function MusicVolumeSlider({ topicId, channelId, currentVolume }) {
  const initialPct = Math.round((currentVolume ?? 0.2) * 100);
  const [pct, setPct] = useState(initialPct);
  const [saved, setSaved] = useState(true); // starts in "saved" state
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef(null);

  const handleChange = (e) => {
    const val = parseInt(e.target.value);
    setPct(val);
    setSaved(false);
    // debounce auto-save after 800ms of no movement
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(val), 800);
  };

  const doSave = (value) => {
    const formData = new FormData();
    formData.set('topicId', topicId);
    formData.set('channelId', channelId);
    formData.set('background_music_volume', String(value / 100));

    startTransition(async () => {
      try {
        await updateMusicVolume(formData);
        setSaved(true);
        toast.success(`Music volume set to ${value}%`);
      } catch (err) {
        toast.error(err.message || 'Failed to save volume');
      }
    });
  };

  const VolumeIcon = pct === 0 ? FaVolumeMute : pct < 40 ? FaVolumeDown : FaVolumeUp;

  // Colour thresholds
  const trackColor =
    pct === 0
      ? '#d1d5db'          // gray-300
      : pct <= 30
      ? '#a78bfa'          // violet-400
      : pct <= 70
      ? '#8b5cf6'          // violet-500
      : '#7c3aed';         // violet-600

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <VolumeIcon className="text-violet-500 text-sm" />
          </div>
          <div>
            <h2
              className="text-[16px] font-bold text-stone-900 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Background Music Volume
            </h2>
            <p className="text-[13px] text-stone-400 mt-0.5">
              Controls how loud the music is when mixed with the video narration
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isPending ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-violet-500 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">
              <FaSpinner className="animate-spin text-[10px]" />
              Saving…
            </span>
          ) : saved ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              <FaCheck className="text-[10px]" />
              Saved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
              Unsaved
            </span>
          )}
        </div>
      </div>

      {/* Slider body */}
      <div className="px-7 py-7">
        {/* Volume value display */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <span
              className="text-[44px] font-extrabold text-stone-900 leading-none tabular-nums"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {pct}
            </span>
            <span className="text-[20px] font-bold text-stone-400 ml-1">%</span>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-semibold text-stone-400">
              {pct === 0
                ? 'Music muted'
                : pct <= 15
                ? 'Very subtle'
                : pct <= 30
                ? 'Subtle'
                : pct <= 50
                ? 'Balanced'
                : pct <= 70
                ? 'Prominent'
                : 'Very loud'}
            </p>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Raw value: {(pct / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* The slider */}
        <div className="relative">
          {/* Filled track background via gradient trick */}
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-2 rounded-full pointer-events-none transition-all duration-150"
            style={{ width: `${pct}%`, background: trackColor }}
          />
          <input
            id="music-volume-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={pct}
            onChange={handleChange}
            className="relative w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-100"
            style={{
              // WebKit thumb override via inline style since we can't use global CSS easily
              WebkitAppearance: 'none',
            }}
          />
        </div>

        {/* Tick labels */}
        <div className="flex justify-between mt-2 px-0.5">
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setPct(v); setSaved(false); clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => doSave(v), 100); }}
              className={`text-[11px] font-semibold transition-colors ${
                pct === v ? 'text-violet-600' : 'text-stone-300 hover:text-stone-500'
              }`}
            >
              {v}%
            </button>
          ))}
        </div>

        {/* Recommendation hint */}
        <div className="mt-5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-stone-50 border border-gray-100">
          <span className="text-violet-500 text-sm mt-0.5">💡</span>
          <p className="text-[12px] text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-700">Recommended: 15–25%</span> — keeps music audible without
            overpowering the narration audio. The default is <span className="font-semibold">20%</span>.
          </p>
        </div>
      </div>

      {/* Slider thumb styles */}
      <style jsx global>{`
        #music-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid #7c3aed;
          box-shadow: 0 2px 8px rgba(124,58,237,0.25);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        #music-volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(124,58,237,0.35);
        }
        #music-volume-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid #7c3aed;
          box-shadow: 0 2px 8px rgba(124,58,237,0.25);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
