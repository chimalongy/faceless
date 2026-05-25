'use client';

import { useState } from 'react';
import { FaMagic, FaMicrophone, FaLink } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Modal from '../../components/ui/Modal';

export default function GenerateAudioButton({ storyId, variant = 'primary', label = 'Generate from Script', voices = [] }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generationMode, setGenerationMode] = useState('clone');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [audioLink, setAudioLink] = useState('');
  const router = useRouter();

  const handleOpenModal = () => {
    setShowModal(true);
    if (voices.length > 0 && !selectedVoiceId) {
      setSelectedVoiceId(voices[0].voice_id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAudioLink('');
  };

  const handleGenerate = async () => {
    if (generationMode === 'link' && !audioLink.trim()) {
      toast.error('Please provide an audio generation link');
      return;
    }

    if (generationMode === 'clone' && !selectedVoiceId) {
      toast.error('Please select a voice clone');
      return;
    }

    setLoading(true);
    setShowModal(false);
    const loadingToast = toast.loading('Generating audio from script...');

    try {
      const payload = {
        storyId,
        generation_mode: generationMode,
        ...(generationMode === 'link' ? { audio_generation_link: audioLink } : {}),
        ...(generationMode === 'clone' ? { voice_id: selectedVoiceId } : {})
      };

      const res = await fetch('/api/generate/audio/generate-script-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Audio generation failed');
      }

      toast.success('Audio generation completed!', { id: loadingToast });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
      setAudioLink('');
    }
  };

  const baseClasses = 'inline-flex items-center gap-2 rounded-xl font-semibold text-sm transition-all';
  const styles =
    variant === 'primary'
      ? 'px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0 shadow-md shadow-purple-500/20'
      : 'px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 hover:-translate-y-px active:translate-y-0 shadow-md shadow-purple-500/20';

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={loading}
        className={`${baseClasses} ${styles} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <FaMagic className="text-xs" />
        <span>{loading ? 'Generating…' : label}</span>
      </button>

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Generate Audio">
        <div className="space-y-6">
          {/* Toggle Switch */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setGenerationMode('clone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${generationMode === 'clone'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FaMicrophone className="text-xs" />
              Use Cloned Voice
            </button>
            <button
              onClick={() => setGenerationMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${generationMode === 'link'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FaLink className="text-xs" />
              Use Gradio Link
            </button>
          </div>

          {/* Content based on mode */}
          <div className="min-h-[120px]">
            {generationMode === 'clone' ? (
              <div className="space-y-4">
                {voices.length === 0 ? (
                  <div className="text-center py-6 text-stone-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No cloned voices found. Please create a voice clone first.
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Select a Voice Clone
                    </label>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {voices.map((voice) => (
                        <div
                          key={voice.id}
                          onClick={() => setSelectedVoiceId(voice.voice_id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedVoiceId === voice.voice_id
                            ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                            : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedVoiceId === voice.voice_id ? 'border-purple-500' : 'border-gray-400'
                            }`}>
                            {selectedVoiceId === voice.voice_id && (
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-stone-900 truncate text-sm">
                              {voice.voice_id}
                            </p>
                            <p className="text-xs text-stone-500">
                              {voice.clone_status === 'completed' ? 'Ready to use' : voice.clone_status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="audio-link" className="block text-sm font-medium text-stone-700 mb-2">
                  Enter the audio generation link
                </label>
                <input
                  id="audio-link"
                  type="url"
                  value={audioLink}
                  onChange={(e) => setAudioLink(e.target.value)}
                  placeholder="https://example.gradio.live"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                />
                <p className="mt-2 text-xs text-stone-500">
                  Paste the Gradio link from your TTS service
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl border border-gray-200 text-stone-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={
                loading ||
                (generationMode === 'link' && !audioLink.trim()) ||
                (generationMode === 'clone' && !selectedVoiceId)
              }
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-md shadow-purple-500/20"
            >
              {loading ? 'Generating...' : 'Generate Audio'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}