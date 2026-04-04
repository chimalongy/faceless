import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChannel } from '../../../../../../lib/actions';
import { getSessionCookie } from '../../../../../../lib/auth';
import { FaArrowLeft, FaCog } from 'react-icons/fa';
import ChannelConfigureForm from './ChannelConfigureForm';

export default async function ChannelConfigurePage({ params }) {
  const channelId = (await params).channelId;
  const userId = await getSessionCookie();
  
  if (!userId) notFound();

  const channel = await getChannel(channelId);

  if (!channel || channel.user_id !== userId) {
    notFound();
  }

  // Parse existing configurations
  let initialConfig = {};
  try {
    if (channel.configurations) {
      initialConfig = JSON.parse(channel.configurations);
    }
  } catch (err) {
    console.error('Failed to parse channel configurations:', err);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation header */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href={`/dashboard/channels/${channelId}/v1`}
            className="inline-flex items-center gap-2 group text-gray-500 hover:text-orange-600 transition-colors font-medium text-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-orange-50 transition-colors">
              <FaArrowLeft className="text-xs" />
            </div>
            Back to {channel.name}
          </Link>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-orange-100 shadow-sm">
            <FaCog className="text-orange-500 animate-spin-slow" />
            <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">Configuration</span>
          </div>
        </div>

        {/* Header content */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Channel Settings
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            Configure integration keys and API credentials for <span className="text-orange-600 font-semibold">{channel.name}</span>. These settings are used for background tasks like video distribution.
          </p>
        </div>

        {/* Configuration Form */}
        <div className="relative">
          <ChannelConfigureForm 
            channelId={channelId} 
            initialConfig={initialConfig} 
          />
        </div>

        {/* Helper footer */}
        <div className="mt-16 p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2">Security Advisory</h4>
              <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                Only enter API credentials that you trust. These keys are stored securely in your dashboard and are only accessed by authorized automated background workers for channel-specific tasks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
