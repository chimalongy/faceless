'use client';

import { useState } from 'react';
import { FaMagic, FaTimes, FaClock, FaMusic } from 'react-icons/fa';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { label: '30s', value: 30, desc: 'Short clip' },
  { label: '60s', value: 60, desc: '1 minute' },
  { label: '90s', value: 90, desc: '1.5 minutes' },
  { label: '120s', value: 120, desc: '2 minutes' },
  { label: '180s', value: 180, desc: '3 minutes' },
  { label: '240s', value: 240, desc: '4 minutes' },
];

export default function GenerateTopicMusicModal({ topicId, hasExisting }) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectiveDuration = useCustom
    ? Math.min(300, Math.max(10, parseInt(customDuration) || 60))
    : duration;

  const handleGenerate = async () => {
    setLoading(true);
    const t = toast.loading(
      hasExisting ? 'Regenerating background music…' : 'Generating background music…'
    );
    try {
      const res = await fetch('/api/generate/topic-background-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, music_length: effectiveDuration }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start');

      toast.success(
        '🎵 Music generation started! Check back in a few minutes.',
        { id: t, duration: 5000 }
      );
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to start music generation', { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        id="generate-topic-music-btn"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white font-semibold text-sm shadow-md shadow-violet-500/20 hover:-translate-y-px active:translate-y-0 transition-all"
      >
        <FaMagic className="text-xs" />
        {hasExisting ? 'Regenerate with AI' : 'Generate with AI'}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ animation: 'fadeInScale 0.18s ease' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                  <FaMusic className="text-violet-500 text-sm" />
                </div>
                <div>
                  <h2
                    className="text-[16px] font-extrabold text-stone-900 tracking-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {hasExisting ? 'Regenerate Music' : 'Generate Music'}
                  </h2>
                  <p className="text-[12px] text-stone-400">
                    Choose a duration for your track
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-gray-100 transition-all"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {hasExisting && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-amber-500 mt-0.5">⚠️</span>
                  <p className="text-[13px] text-amber-700 leading-snug">
                    This will replace the existing background music. The topic&apos;s AI prompt will be used to generate a fresh track.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FaClock className="text-[11px] text-stone-400" />
                  <p className="text-[13px] font-semibold text-stone-700">Track Duration</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setDuration(opt.value); setUseCustom(false); }}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all text-center ${
                        !useCustom && duration === opt.value
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-100 bg-white text-stone-600 hover:border-violet-200 hover:bg-violet-50/40'
                      }`}
                    >
                      <span className="text-[15px] font-bold leading-none">{opt.label}</span>
                      <span className="text-[10px] mt-1 opacity-60">{opt.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Custom duration */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setUseCustom(!useCustom)}
                    className={`text-[12px] font-semibold transition-colors ${
                      useCustom ? 'text-violet-600' : 'text-stone-400 hover:text-violet-500'
                    }`}
                  >
                    {useCustom ? '✓ Custom duration selected' : '+ Use custom duration'}
                  </button>
                  {useCustom && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        placeholder="e.g. 150"
                        className="w-28 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-sm text-stone-900"
                      />
                      <span className="text-[13px] text-stone-400">seconds (10 – 300)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-50 border border-gray-100">
                <span className="text-[11px] text-stone-400">Selected:</span>
                <span className="text-[13px] font-bold text-stone-700">
                  {effectiveDuration}s
                </span>
                <span className="text-[11px] text-stone-400">
                  (~{Math.floor(effectiveDuration / 60)}m {effectiveDuration % 60}s)
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-stone-50/60">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                id="confirm-generate-music-btn"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white font-semibold text-sm shadow-md shadow-violet-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FaMagic className="text-xs" />
                )}
                {loading ? 'Starting…' : `Generate ${effectiveDuration}s Track`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  );
}
