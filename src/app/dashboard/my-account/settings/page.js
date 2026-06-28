'use client';

import { useState, useEffect, useTransition } from 'react';
import { FaUserCircle, FaBrain, FaChevronRight, FaRegEnvelope, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getUserSettings, updateUserSettings } from '../../../../lib/actions';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useGroq, setUseGroq] = useState(false);
  const [imageGenModel, setImageGenModel] = useState('cloudfare_worker');
  const [ttsEndpoint, setTtsEndpoint] = useState('');
  const [thumbnailEndpoint, setThumbnailEndpoint] = useState('');
  const [transcriptionEndpoint, setTranscriptionEndpoint] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getUserSettings();
        setUser(data);
        setUseGroq(data?.use_groq || false);
        setImageGenModel(data?.image_gen_model || 'cloudfare_worker');
        setTtsEndpoint(data?.tts_endpoint || 'https://geniusdomainnames--kokoro-tts-web.modal.run/synthesize');
        setThumbnailEndpoint(data?.thumbnail_endpoint || 'https://geniusdomainnames--microsoft-lens-generate-endpoint.modal.run');
        setTranscriptionEndpoint(data?.transcription_endpoint || 'https://me-chimaobi--whisper-api-optimized-whisperservice-transcribe.modal.run');
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load account settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggleGroq = async (checked) => {
    // Optimistic UI update
    setUseGroq(checked);

    startTransition(async () => {
      try {
        await updateUserSettings({ use_groq: checked });
        toast.success(`Groq integration ${checked ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('Failed to update settings:', error);
        toast.error('Failed to save settings. Reverting changes.');
        // Revert change on error
        setUseGroq(!checked);
      }
    });
  };

  const handleImageGenModelChange = async (value) => {
    // Optimistic UI update
    const previousValue = imageGenModel;
    setImageGenModel(value);

    startTransition(async () => {
      try {
        await updateUserSettings({ image_gen_model: value });
        toast.success(`Image generation model changed to ${value === 'cloudfare_worker' ? 'Cloudflare Worker' : 'Modal Service'}!`);
      } catch (error) {
        console.error('Failed to update image gen model:', error);
        toast.error('Failed to save model selection. Reverting changes.');
        // Revert change on error
        setImageGenModel(previousValue);
      }
    });
  };

  const handleSaveEndpoints = async (e) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateUserSettings({
          tts_endpoint: ttsEndpoint,
          thumbnail_endpoint: thumbnailEndpoint,
          transcription_endpoint: transcriptionEndpoint,
        });
        toast.success('API service endpoints saved successfully!');
      } catch (error) {
        console.error('Failed to save endpoints:', error);
        toast.error('Failed to save API service endpoints');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-stone-500 text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-extrabold text-stone-900 tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Account Settings
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Manage your account profile, credentials, and model integration preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Settings Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
            <h2
              className="text-lg font-bold text-stone-900 flex items-center gap-2.5"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <FaUser className="text-orange-500 text-base" />
              Profile Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">First Name</span>
                <div className="px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-stone-700 font-medium text-sm">
                  {user?.first_name || 'N/A'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Last Name</span>
                <div className="px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-stone-700 font-medium text-sm">
                  {user?.last_name || 'N/A'}
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Email Address</span>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-stone-500 font-medium text-sm">
                  <FaRegEnvelope className="text-stone-400 flex-shrink-0" />
                  {user?.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Model Integration Preferences */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2
                  className="text-lg font-bold text-stone-900 flex items-center gap-2.5"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <FaBrain className="text-orange-500 text-base" />
                  Model Integration
                </h2>
                <p className="text-stone-500 text-xs max-w-md">
                  Enable high-speed, cost-effective inference pipelines powered by Groq. When disabled, the system defaults to Moonshot or custom providers.
                </p>
              </div>
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={useGroq}
                  disabled={isPending}
                  onChange={(e) => handleToggleGroq(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100/50 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-orange-800">Why use Groq?</span>
              </div>
              <p className="text-xs text-orange-700 leading-relaxed">
                Groq's LPU (Language Processing Unit) architecture processes narrative scripts up to 10x faster than traditional GPU instances, resulting in instant generation updates when writing scripts.
              </p>
            </div>
          </div>

          {/* Image Generation Engine Settings */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
            <div className="space-y-1">
              <h2
                className="text-lg font-bold text-stone-900 flex items-center gap-2.5"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <FaBrain className="text-orange-500 text-base" />
                Image Generation Engine
              </h2>
              <p className="text-stone-500 text-xs">
                Choose the default AI backend model to generate scene images and video frames.
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="image_gen_model" className="text-xs font-semibold text-stone-600 block">
                Select Generator Model
              </label>
              <div className="relative max-w-md">
                <select
                  id="image_gen_model"
                  value={imageGenModel}
                  disabled={isPending}
                  onChange={(e) => handleImageGenModelChange(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none cursor-pointer appearance-none animate-fade-in"
                >
                  <option value="cloudfare_worker">⚡ Cloudflare Worker (Fast &amp; Standard)</option>
                  <option value="modal_service">🎨 Modal Service (FLUX.1-Kontext-dev - Premium)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100/50 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-orange-800">Engine Comparison</span>
              </div>
              <div className="text-xs text-orange-700 space-y-1.5 leading-relaxed">
                <p>
                  <strong>Cloudflare Worker:</strong> Generates images quickly using standard lightweight models. Good for draft story generation.
                </p>
                <p>
                  <strong>Modal Service:</strong> Runs gated premium model <code>black-forest-labs/FLUX.1-Kontext-dev</code> on an A100-80GB GPU. Best for visual consistency, high detail, and photorealistic story output.
                </p>
              </div>
            </div>
          </div>

          {/* API Service Endpoints */}
          <form onSubmit={handleSaveEndpoints} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
            <div className="space-y-1">
              <h2
                className="text-lg font-bold text-stone-900 flex items-center gap-2.5"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <FaBrain className="text-orange-500 text-base" />
                API Service Endpoints
              </h2>
              <p className="text-stone-500 text-xs">
                Configure your custom Modal execution endpoints for audio, thumbnail, and subtitle transcription.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tts_endpoint" className="text-xs font-semibold text-stone-600">
                  Kokoro TTS Synthesis Endpoint
                </label>
                <input
                  id="tts_endpoint"
                  type="url"
                  value={ttsEndpoint}
                  onChange={(e) => setTtsEndpoint(e.target.value)}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="thumbnail_endpoint" className="text-xs font-semibold text-stone-600">
                  Microsoft Lens Thumbnail Endpoint
                </label>
                <input
                  id="thumbnail_endpoint"
                  type="url"
                  value={thumbnailEndpoint}
                  onChange={(e) => setThumbnailEndpoint(e.target.value)}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transcription_endpoint" className="text-xs font-semibold text-stone-600">
                  Whisper Transcription Endpoint
                </label>
                <input
                  id="transcription_endpoint"
                  type="url"
                  value={transcriptionEndpoint}
                  onChange={(e) => setTranscriptionEndpoint(e.target.value)}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                  placeholder="https://..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/10 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Endpoints'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <FaUserCircle className="text-orange-500 text-2xl" />
            </div>
            <div>
              <h3
                className="text-[16px] font-bold text-stone-900"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Need Help?
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                If you are running into issues toggling models or connecting your channel, please reach out to system admin or check database configurations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
