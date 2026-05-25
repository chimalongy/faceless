'use client';

import { useMemo, useState } from 'react';
import { FaEdit, FaTimes, FaSave } from 'react-icons/fa';

export default function EditableGeneratedScript({
  storyId,
  initialScript,
  updateAction,
}) {
  const initial = useMemo(() => initialScript ?? '', [initialScript]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initial);

  const startEdit = () => {
    setDraft(initial);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(initial);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {!isEditing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-stone-600 hover:text-orange-600 transition-all text-sm font-medium"
          >
            <FaEdit className="text-xs" />
            <span>Edit</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-stone-600 hover:text-stone-900 transition-all text-sm font-medium"
          >
            <FaTimes className="text-xs" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4">
          <pre className="whitespace-pre-wrap font-mono text-[14px] leading-relaxed text-stone-700">
            {initial}
          </pre>
        </div>
      ) : (
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="storyId" value={storyId} />
          <textarea
            name="generated_script"
            rows={12}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-stone-700 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all resize-y font-mono text-[14px] leading-relaxed"
            placeholder="Your generated script will appear here..."
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="group inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all"
            >
              <FaSave className="text-xs group-hover:scale-110 transition-transform" />
              <span>Save Script Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}