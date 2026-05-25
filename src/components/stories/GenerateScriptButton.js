'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';

export default function GenerateScriptButton({ isGenerated, storyId }) {
  const [loading, setLoading] = useState(false);

  const handleGenerateScript = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Script generation started!');
        window.location.reload();
      } else {
        alert(`❌ Error: ${data.error || 'Failed to generate script'}`);
      }
    } catch (error) {
      console.error('Generate script error:', error);
      alert('❌ Error: Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  if (isGenerated) {
    return (
      <button
        onClick={handleGenerateScript}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
        ) : (
          <FaMagic className="text-xs" />
        )}
        {loading ? 'Regenerating...' : 'Regenerate Script'}
      </button>
    );
  }

  return (
    <button
      onClick={handleGenerateScript}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <FaMagic className="text-xs" />
      )}
      {loading ? 'Generating...' : 'Generate Script'}
    </button>
  );
}