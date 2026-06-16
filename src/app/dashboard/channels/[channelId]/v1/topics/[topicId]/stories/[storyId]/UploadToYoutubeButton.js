'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FaYoutube,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaCalendarAlt,
  FaTimes,
  FaBolt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return a datetime-local string value 1 hour from now (in local time). */
function defaultScheduleTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  // "datetime-local" input needs "YYYY-MM-DDTHH:MM"
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local string (local time) to a UTC ISO string for the API. */
function toUTCIso(localDatetimeStr) {
  return new Date(localDatetimeStr).toISOString();
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ postStatus }) {
  if (postStatus === 'true') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[12px] font-semibold text-emerald-700">
        <FaCheckCircle className="text-emerald-500" />
        Published to YouTube
      </span>
    );
  }
  if (postStatus === 'scheduled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[12px] font-semibold text-blue-700">
        <FaClock className="text-blue-500 animate-pulse" />
        Scheduled for YouTube
      </span>
    );
  }
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UploadToYoutubeButton({ storyId, postStatus }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState('now'); // 'now' | 'schedule'
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleTime);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsModalOpen(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    const isScheduled = mode === 'schedule';
    const label = isScheduled ? 'Scheduling upload…' : 'Sending to PostersHive…';
    const t = toast.loading(label);

    try {
      const body = { storyId };
      if (isScheduled) {
        if (!scheduledAt) {
          toast.error('Please pick a schedule date & time.', { id: t });
          return;
        }
        // Validate: must be in the future
        if (new Date(scheduledAt) <= new Date()) {
          toast.error('Scheduled time must be in the future.', { id: t });
          return;
        }
        body.scheduled_at = toUTCIso(scheduledAt);
      }

      const res = await fetch('/api/generate/upload-to-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Request failed');

      const successMsg = isScheduled
        ? `📅 Video scheduled for ${new Date(scheduledAt).toLocaleString()}!`
        : '🚀 Video queued for posting to YouTube!';

      toast.success(successMsg, { id: t });
      setIsModalOpen(false);
    } catch (err) {
      console.error('YouTube upload error:', err);
      toast.error(err.message || 'Failed to start YouTube upload', { id: t });
    } finally {
      setLoading(false);
    }
  };

  // ── Already published/scheduled: show badge only ──────────────────────────
  if (postStatus === 'true' || postStatus === 'scheduled') {
    return <StatusBadge postStatus={postStatus} />;
  }

  // ── Trigger button ────────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => { setMode('now'); setScheduledAt(defaultScheduleTime()); setIsModalOpen(true); }}
        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
        id="upload-to-youtube-btn"
      >
        <FaYoutube className="text-xl group-hover:scale-110 transition-transform" />
        <span>Upload to YouTube</span>
      </button>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ animation: 'modalPop 0.18s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <FaYoutube className="text-red-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-stone-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Publish to YouTube
                  </h3>
                  <p className="text-[12px] text-stone-400 mt-0.5">via PostersHive</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setMode('now')}
                  id="publish-now-tab"
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                    mode === 'now'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <FaBolt className={mode === 'now' ? 'text-orange-500' : 'text-stone-400'} />
                  Publish Now
                </button>
                <button
                  onClick={() => setMode('schedule')}
                  id="schedule-tab"
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                    mode === 'schedule'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <FaCalendarAlt className={mode === 'schedule' ? 'text-blue-500' : 'text-stone-400'} />
                  Schedule
                </button>
              </div>

              {/* Conditional content */}
              {mode === 'now' ? (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <p className="text-[13px] text-stone-700 leading-relaxed">
                    The video will be sent to <span className="font-semibold text-stone-900">PostersHive</span> immediately and posted to your connected YouTube channel right away.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-[13px] font-semibold text-stone-700">
                    <span className="flex items-center gap-1.5 mb-2">
                      <FaCalendarAlt className="text-blue-500 text-xs" />
                      Pick a date &amp; time
                    </span>
                    <input
                      type="datetime-local"
                      id="schedule-datetime-input"
                      value={scheduledAt}
                      min={defaultScheduleTime()}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                    />
                  </label>
                  <p className="text-[11px] text-stone-400">
                    Time is in your local timezone — it will be converted to UTC before being sent to PostersHive.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-[13px] font-semibold text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                id="confirm-publish-btn"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-md transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed ${
                  mode === 'schedule'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow-blue-500/25'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 shadow-red-500/25'
                }`}
              >
                {loading ? (
                  <FaSpinner className="animate-spin" />
                ) : mode === 'schedule' ? (
                  <FaCalendarAlt />
                ) : (
                  <FaYoutube />
                )}
                {loading
                  ? 'Working…'
                  : mode === 'schedule'
                  ? 'Confirm Schedule'
                  : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe for modal pop animation */}
      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
