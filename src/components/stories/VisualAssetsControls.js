'use client';

import { useState } from 'react';
import GenerateAllImagesButton from './GenerateAllImagesButton';

export default function VisualAssetsControls({ storyId }) {
  const [useCustomLink, setUseCustomLink] = useState(false);
  const [defaultLink, setDefaultLink] = useState('');

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
      {/* Row 1 on mobile: Toggle + Generate button side by side */}
      <div className="flex items-center justify-between gap-2 sm:contents">
        {/* Custom Link toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-stone-500 whitespace-nowrap">Custom Link</span>
          <button
            type="button"
            onClick={() => setUseCustomLink(!useCustomLink)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
              useCustomLink ? 'bg-orange-500' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={useCustomLink}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                useCustomLink ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Generate button — always visible */}
        <div className="sm:hidden">
          <GenerateAllImagesButton
            storyId={storyId}
            useCustomLink={useCustomLink}
            defaultLink={defaultLink}
          />
        </div>
      </div>

      {/* Custom link input — full width on mobile, inline on desktop */}
      {!useCustomLink && (
        <input
          type="url"
          value={defaultLink}
          onChange={(e) => setDefaultLink(e.target.value)}
          placeholder="Default link (optional)"
          className="w-full sm:w-auto sm:flex-1 sm:min-w-[140px] px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
        />
      )}

      {/* Generate button — desktop only (hidden on mobile, shown above) */}
      <div className="hidden sm:block">
        <GenerateAllImagesButton
          storyId={storyId}
          useCustomLink={useCustomLink}
          defaultLink={defaultLink}
        />
      </div>
    </div>
  );
}