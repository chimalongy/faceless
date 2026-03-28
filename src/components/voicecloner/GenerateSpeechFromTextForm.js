'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaMagic } from 'react-icons/fa';

export default function GenerateSpeechFromTextForm({ cloneId, topicId }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const onGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error('Please enter text');
      return;
    }

    setLoading(true);
    const t = toast.loading('Generating speech…');
    try {
      const res = await fetch('/api/voice-clone/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cloneId, text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate speech');

      setAudioUrl(data.audioUrl);
      toast.success('Speech generated', { id: t });
    } catch (err) {
      toast.error(err.message || 'Failed to generate speech', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const onGenerateMusic = async () => {
    const t = toast.loading('Starting music generation…');
    try {
      const res = await fetch('/api/generate/audio/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start generation');

      console.log('🎵 Music generation task started, runId:', data.runId);
      toast.success('Music generation started in background!', { id: t });
    } catch (err) {
      toast.error(err.message || 'Failed to start music generation', { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <button
        className="border shadow-xl p-2 rounded-2xl"
        onClick={onGenerateMusic}
      >
        Generate Music 🎵
      </button>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text to speak
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-gray-200 p-4 text-sm outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 bg-white"
          placeholder="Paste or type the text you want to generate speech for…"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-70"
        >
          <FaMagic />
          <span>{loading ? 'Generating…' : 'Generate Speech'}</span>
        </button>

        {audioUrl && (
          <a
            href={audioUrl}
            download
            className="text-sm font-medium text-orange-600 hover:text-orange-700 underline"
          >
            Download audio
          </a>
        )}
      </div>

      {audioUrl && (
        <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
          <audio controls src={audioUrl} className="w-full" preload="none" />
        </div>
      )}
    </div>
  );
}


