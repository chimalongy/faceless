'use client';

import { useState, useRef, useTransition } from 'react';
import { FaPencilAlt, FaTimes, FaCheck, FaQuoteLeft, FaClock, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateMusicPrompt } from '../../lib/actions';

export default function EditMusicPromptForm({ topicId, channelId, currentPrompt, currentDuration }) {
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState(currentPrompt || '');
  const [duration, setDuration] = useState(currentDuration || '');
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef(null);

  const handleOpen = () => {
    setPrompt(currentPrompt || '');
    setDuration(currentDuration || '');
    setEditing(true);
    // Focus textarea after render
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleCancel = () => {
    setPrompt(currentPrompt || '');
    setDuration(currentDuration || '');
    setEditing(false);
  };

  const handleSave = () => {
    if (!prompt.trim()) {
      toast.error('Music prompt cannot be empty');
      return;
    }

    const formData = new FormData();
    formData.set('topicId', topicId);
    formData.set('channelId', channelId);
    formData.set('background_music_prompt', prompt.trim());
    if (duration) formData.set('background_music_duration', String(duration));

    startTransition(async () => {
      try {
        await updateMusicPrompt(formData);
        toast.success('Music prompt updated!');
        setEditing(false);
      } catch (err) {
        toast.error(err.message || 'Failed to update prompt');
      }
    });
  };

  const charCount = prompt.length;
  const charLimit = 300;
  const overLimit = charCount > charLimit;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaQuoteLeft className="text-violet-500 text-sm" />
          </div>
          <div>
            <h2
              className="text-[16px] font-bold text-stone-900 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Music Prompt
            </h2>
            <p className="text-[13px] text-stone-400 mt-0.5">
              Describes the style &amp; mood used for AI music generation
            </p>
          </div>
        </div>

        {!editing && (
          <button
            id="edit-music-prompt-btn"
            onClick={handleOpen}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100 hover:border-violet-200 transition-all"
          >
            <FaPencilAlt className="text-[10px]" />
            Edit Prompt
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="px-7 py-6">
        {editing ? (
          <div className="space-y-4">
            {/* Prompt textarea */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-stone-700">
                Background Music Prompt
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Cinematic orchestral music with subtle tension, slow tempo, deep strings and light piano. Suitable for dramatic storytelling…"
                className={`w-full px-4 py-3 rounded-xl border text-[14px] text-stone-900 leading-relaxed placeholder:text-stone-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none ${
                  overLimit ? 'border-red-300 focus:ring-red-400' : 'border-gray-200'
                }`}
              />
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-stone-400">
                  The AI uses this description to compose the music (max 300 chars for the generation API).
                </p>
                <span
                  className={`text-[12px] font-semibold tabular-nums ${
                    overLimit ? 'text-red-500' : charCount > 250 ? 'text-amber-500' : 'text-stone-400'
                  }`}
                >
                  {charCount}/{charLimit}
                </span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-stone-700">
                Default Duration (seconds)
                <span className="text-stone-400 font-normal ml-1">— optional</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] text-stone-900 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                />
                <div className="flex items-center gap-1.5 text-[12px] text-stone-400">
                  <FaClock className="text-[10px]" />
                  <span>
                    {duration
                      ? `~${Math.floor(parseInt(duration) / 60)}m ${parseInt(duration) % 60}s`
                      : 'Will default to 60s when generating'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                id="save-music-prompt-btn"
                onClick={handleSave}
                disabled={isPending || overLimit || !prompt.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[13px] font-semibold shadow-md shadow-violet-500/20 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <FaSpinner className="text-xs animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <FaCheck className="text-xs" />
                    Save Prompt
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-stone-500 hover:bg-gray-100 transition-all"
              >
                <FaTimes className="inline mr-1.5 text-xs" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Read-only view */
          <div className="space-y-4">
            {currentPrompt ? (
              <>
                <blockquote className="text-[15px] text-stone-700 leading-relaxed border-l-4 border-violet-300 pl-5 italic">
                  {currentPrompt}
                </blockquote>
                {currentDuration && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 border border-gray-100">
                    <FaClock className="text-[11px] text-stone-400" />
                    <span className="text-[12px] font-semibold text-stone-500">
                      Default duration: {currentDuration}s
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-[14px] text-stone-400 leading-relaxed">
                  No music prompt set yet. Add one so the AI knows what kind of music to generate.
                </p>
                <button
                  onClick={handleOpen}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-all"
                >
                  <FaPencilAlt className="text-[10px]" />
                  Add Music Prompt
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
