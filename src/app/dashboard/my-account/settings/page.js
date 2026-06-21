'use client';

import { useState, useEffect, useTransition } from 'react';
import { FaUserCircle, FaBrain, FaChevronRight, FaRegEnvelope, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getUserSettings, updateUserSettings } from '../../../../lib/actions';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useGroq, setUseGroq] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getUserSettings();
        setUser(data);
        setUseGroq(data?.use_groq || false);
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
        await updateUserSettings(checked);
        toast.success(`Groq integration ${checked ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('Failed to update settings:', error);
        toast.error('Failed to save settings. Reverting changes.');
        // Revert change on error
        setUseGroq(!checked);
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
