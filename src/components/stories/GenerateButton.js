'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';

export default function GenerateButton({ isGenerated, storyId }) {
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
        // Refresh the page to see updates
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
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <span className="animate-spin">⌛</span> : <FaMagic />}
        {loading ? 'Regenerating...' : 'Regenerate Script'}
      </button>
    );
  }

  return (
    <button
      onClick={handleGenerateScript}
      disabled={loading}
      className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <span className="animate-spin">⌛</span> : <FaMagic />}
      {loading ? 'Generating...' : 'Generate Script'}
    </button>
  );
}
