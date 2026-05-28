'use client';

import { useState } from 'react';
import { FaSave, FaSpinner, FaLock, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import { updateChannelConfigurations, testPostersHiveConnection } from '../../../../../../lib/actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ChannelConfigureForm({ channelId, initialConfig = {} }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apiKey, setApiKey] = useState(initialConfig.postershive?.api_key || '');
  const [showKey, setShowKey] = useState(false);
  const [isTested, setIsTested] = useState(false);

  const isConnected = !!initialConfig.postershive?.api_key;

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    // Reset test state if user types a new key
    if (isTested) {
      setIsTested(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a PostersHive API Key first');
      return;
    }

    setTesting(true);
    const t = toast.loading('Testing connection to PostersHive...');

    try {
      const res = await testPostersHiveConnection(apiKey);
      if (res.success) {
        setIsTested(true);
        toast.success(res.message || 'Connection successful!', { id: t });
      } else {
        toast.error(res.error || 'Failed to establish connection', { id: t });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to test connection', { id: t });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!isTested) {
      toast.error('Please test the connection successfully before saving.');
      return;
    }

    setLoading(true);
    const t = toast.loading('Saving configuration...');

    try {
      const fullConfig = {
        ...initialConfig,
        postershive: {
          api_key: apiKey
        }
      };
      
      const result = await updateChannelConfigurations(channelId, fullConfig);
      if (result.success) {
        toast.success('Configuration saved successfully!', { id: t });
        router.push(`/dashboard/channels/${channelId}/v1`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save configuration', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/channels/${channelId}/v1`);
  };

  return (
    <div className="space-y-8">
      {/* PostersHive API Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-orange-100 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md">
        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <HiSparkles className="text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">PostersHive API Integration</h3>
              <p className="text-sm text-gray-500 mt-0.5">Automate video uploads via your PostersHive account</p>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold shadow-sm">
              <FaCheckCircle className="text-[10px]" />
              CONNECTED
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaLock className="text-xs text-gray-400" />
              PostersHive API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={handleApiKeyChange}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none bg-gray-50/50 text-sm font-medium"
                placeholder="Enter your PostersHive API Key"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 transition-colors"
              >
                {showKey ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
          </div>
        </div>

        {/* Helpful instructions */}
        <div className="mt-8 p-4 rounded-xl bg-orange-50/30 border border-orange-100/50">
          <p className="text-xs text-stone-600 leading-relaxed">
            * Provide your unique account API Key from your PostersHive dashboard. This allows the background workers to coordinate automatically to upload and publish generated YouTube videos under your brand seamlessly.
          </p>
        </div>
      </div>

      {/* Button controls */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-[0.98]"
        >
          Cancel
        </button>

        {isTested ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/15 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaSave className="text-sm" />}
            <span>{loading ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-violet-500/15 hover:from-violet-600 hover:to-indigo-600 hover:shadow-violet-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {testing ? <FaSpinner className="animate-spin text-sm" /> : <HiSparkles className="text-sm" />}
            <span>{testing ? 'Testing Connection...' : 'Test Connection'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
