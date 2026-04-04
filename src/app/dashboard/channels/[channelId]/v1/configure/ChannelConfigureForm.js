'use client';

import { useState } from 'react';
import { FaYoutube, FaSave, FaSpinner, FaLock, FaCheckCircle, FaLink } from 'react-icons/fa';
import { updateChannelConfigurations } from '../../../../../../lib/actions';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ChannelConfigureForm({ channelId, initialConfig = {} }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [youtubeConfig, setYoutubeConfig] = useState({
    YT_CLIENT_ID: initialConfig.youtube?.YT_CLIENT_ID || '',
    YT_CLIENT_SECRET: initialConfig.youtube?.YT_CLIENT_SECRET || '',
  });

  const isConnected = !!initialConfig.youtube?.YT_REFRESH_TOKEN;

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('YouTube account connected successfully!');
      // Refresh the page data without full reload to get updated token status
      router.replace(`/dashboard/channels/${channelId}/v1/configure`);
    }
  }, [searchParams, router, channelId]);

  const handleConnect = () => {
    if (!youtubeConfig.YT_CLIENT_ID || !youtubeConfig.YT_CLIENT_SECRET) {
      toast.error('Please save your Client ID and Client Secret first.');
      return;
    }
    // Redirect to our initiation route
    window.location.href = `/api/auth/youtube?channelId=${channelId}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const t = toast.loading('Saving configuration...');

    try {
      const fullConfig = {
        youtube: youtubeConfig
      };
      const result = await updateChannelConfigurations(channelId, fullConfig);
      if (result.success) {
        toast.success('Configuration saved successfully!', { id: t });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save configuration', { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* YouTube API Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <FaYoutube className="text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">YouTube API Configuration</h3>
            <p className="text-sm text-gray-500 mt-0.5">Manage your Google Cloud Console credentials</p>
          </div>
          {isConnected && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold">
              <FaCheckCircle className="text-[10px]" />
              CONNECTED
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaLock className="text-xs text-gray-400" />
              YT_CLIENT_ID
            </label>
            <input
              type="text"
              value={youtubeConfig.YT_CLIENT_ID}
              onChange={(e) => setYoutubeConfig({ ...youtubeConfig, YT_CLIENT_ID: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none bg-gray-50/50"
              placeholder="Enter your YouTube Client ID"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaLock className="text-xs text-gray-400" />
              YT_CLIENT_SECRET
            </label>
            <input
              type="password"
              value={youtubeConfig.YT_CLIENT_SECRET}
              onChange={(e) => setYoutubeConfig({ ...youtubeConfig, YT_CLIENT_SECRET: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none bg-gray-50/50"
              placeholder="••••••••••••••••••••••••"
            />
          </div>
        </div>

        {/* OAuth Connection Button */}
        <div className="mt-8 pt-6 border-t border-gray-50">
          <button
            type="button"
            onClick={handleConnect}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              isConnected 
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-sm'
            }`}
          >
            <FaLink className="text-sm" />
            {isConnected ? 'Re-connect YouTube Account' : 'Connect YouTube Account'}
          </button>
          {!isConnected && (
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              * Make sure to add the redirect URI in Google Cloud Console: 
              <code className="bg-gray-50 px-1 py-0.5 rounded border border-gray-100 mx-1">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/youtube/callback` : '/api/auth/youtube/callback'}
              </code>
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaSave />
          )}
          <span>{loading ? 'Saving Changes...' : 'Save Configuration'}</span>
        </button>
      </div>
    </form>
  );
}
