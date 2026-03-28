'use client';

import { useState } from 'react';
import GenerateAllImagesButton from './GenerateAllImagesButton';

export default function VisualAssetsControls({ storyId }) {
  const [useCustomLink, setUseCustomLink] = useState(false);
  const [defaultLink, setDefaultLink] = useState('');

  return (
    <div className="flex items-center gap-4">
      {/* Toggle for custom generation link */}
      <div className="flex items-center gap-2">
        <label htmlFor="use-custom-link" className="text-sm font-medium text-gray-700 cursor-pointer">
          Use Custom Link
        </label>
        <button
          id="use-custom-link"
          onClick={() => setUseCustomLink(!useCustomLink)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            useCustomLink ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={useCustomLink}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              useCustomLink ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Default link input (shown when toggle is off) - OPTIONAL */}
      {!useCustomLink && (
        <input
          type="url"
          value={defaultLink}
          onChange={(e) => setDefaultLink(e.target.value)}
          placeholder="Default link (optional)"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      )}

      {/* Generate All button */}
      <GenerateAllImagesButton 
        storyId={storyId} 
        useCustomLink={useCustomLink}
        defaultLink={defaultLink}
      />
    </div>
  );
}
