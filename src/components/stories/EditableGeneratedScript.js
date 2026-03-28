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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-300 text-emerald-800 hover:text-emerald-900 transition-all"
          >
            <FaEdit />
            <span className="font-medium">Edit</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all"
          >
            <FaTimes />
            <span className="font-medium">Cancel</span>
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="bg-white/80 rounded-xl border-2 border-emerald-200 px-6 py-4 shadow-inner">
          <pre className="whitespace-pre-wrap font-mono text-[15px] leading-relaxed text-gray-700">
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
            className="w-full rounded-xl border-2 border-emerald-200 bg-white/80 px-6 py-4 text-gray-700 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all resize-y font-mono text-[15px] leading-relaxed shadow-inner"
            placeholder="Your generated script will appear here..."
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="group inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all"
            >
              <FaSave className="group-hover:rotate-12 transition-transform" />
              <span>Save Script Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


