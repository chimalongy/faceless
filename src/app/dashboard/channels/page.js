import Link from 'next/link';
import { getChannels } from '../../../lib/actions';
import { FaPlus, FaTv, FaLayerGroup, FaYoutube, FaChevronRight, FaEllipsisV } from 'react-icons/fa';
import DeleteChannelButton from './DeleteChannelButton';

export default async function ChannelsPage() {
  const channels = await getChannels();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-orange-100/50 shadow-sm">
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
                  <FaTv className="text-white text-sm" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                  Channels
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-500 ml-1">
                Manage all your YouTube channels in one place
              </p>
            </div>
            
            <Link
              href="/dashboard/channels/new"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:from-orange-600 hover:to-amber-600 transition-all active:scale-[0.98] sm:w-auto w-full"
            >
              <FaPlus className="text-xs" />
              <span>Create Channel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-100/60 shadow-sm">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <FaTv className="text-sm" />
                <span className="text-xs font-medium uppercase tracking-wider">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{channels.length}</p>
              <p className="text-xs text-gray-500 mt-1">Channels</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-100/60 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <FaLayerGroup className="text-sm" />
                <span className="text-xs font-medium uppercase tracking-wider">Topics</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {channels.reduce((acc, ch) => acc + (ch.topics?.[0]?.count || 0), 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Across channels</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-100/60 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-purple-500 mb-1">
                <FaYoutube className="text-sm" />
                <span className="text-xs font-medium uppercase tracking-wider">Active</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {channels.filter(ch => ch.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ready to use</p>
            </div>
          </div>

          {channels.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-orange-200 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center border border-orange-200">
                <FaTv className="text-3xl text-orange-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-900">
                No channels yet
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mb-8 max-w-sm mx-auto">
                Get started by creating your first YouTube channel. Organize your content with topics and stories.
              </p>
              <Link
                href="/dashboard/channels/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                <FaPlus className="text-xs" />
                Create Your First Channel
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {channels.map((channel, index) => (
                <div
                  key={channel.id}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-xl border border-orange-100/60 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
                >
                  {/* Gradient Accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/[0.02] group-hover:to-amber-500/[0.02] rounded-xl transition-all pointer-events-none" />
                  
                  <Link
                    href={`/dashboard/channels/${channel.id}/${channel.channel_type}`}
                    className="block p-5 sm:p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <FaTv className="text-white text-xl" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {channel.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {channel.channel_type === 'youtube' ? 'YouTube Channel' : 'Custom Channel'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mobile-friendly indicator */}
                      <div className="sm:hidden">
                        <FaChevronRight className="text-gray-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </div>

                    {/* Description */}
                    {channel.description ? (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                        {channel.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-4 h-10">
                        No description added
                      </p>
                    )}

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-orange-100/60">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100">
                          <FaLayerGroup className="text-emerald-500 text-xs" />
                          <span className="text-sm font-medium text-emerald-700">
                            {channel.topics?.[0]?.count || 0}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          topics
                        </span>
                      </div>
                      
                      {/* Desktop indicator */}
                      <div className="hidden sm:block text-orange-300 group-hover:translate-x-1 group-hover:text-amber-500 transition-all">
                        <FaChevronRight className="text-sm" />
                      </div>
                    </div>

                    {/* Channel Type Badge */}
                    <div className="absolute top-3 right-3 sm:hidden">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                        {channel.channel_type === 'youtube' ? 'YT' : 'Custom'}
                      </span>
                    </div>
                  </Link>

                  {/* Delete Button - Repositioned for mobile */}
                  <div className="absolute top-3 right-3 sm:top-auto sm:bottom-3 sm:right-3">
                    <DeleteChannelButton channelId={channel.id} />
                  </div>

                  {/* Quick Stats Overlay on Hover (Desktop only) */}
                  <div className="hidden sm:block absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-b-xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </div>
              ))}
            </div>
          )}

          {/* Quick Tips Section */}
          {channels.length > 0 && (
            <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Pro Tip</h4>
                  <p className="text-xs text-gray-600">
                    Click on any channel to manage its topics and stories. Each channel can have multiple topics to organize your content better.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}