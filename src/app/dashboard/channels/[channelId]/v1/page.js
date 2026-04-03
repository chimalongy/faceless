import Link from 'next/link';
import { getChannel } from '../../../../../lib/actions';
import { supabase } from '../../../../../lib/supabase';
import { FaArrowLeft, FaPlus, FaLayerGroup, FaFileAlt, FaCalendarAlt, FaCamera, FaImage, FaEllipsisH, FaChartLine, FaUsers, FaVideo } from 'react-icons/fa';
import { notFound } from 'next/navigation';
import GenerateTopicsButton from './GenerateTopicsButton';
import DeleteTopicButton from './DeleteTopicButton';
import ChannelMediaUpload from './ChannelMediaUpload';

async function getTopics(channelId) {
  const { data } = await supabase
    .from('topics')
    .select('*, stories(count)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false });
  return data || [];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default async function ChannelDetailsPage({ params }) {
  const id = (await params).channelId;
  const [channel, topics] = await Promise.all([
    getChannel(id),
    getTopics(id)
  ]);

  if (!channel) {
    notFound();
  }

  const channel_type = channel.channel_type;
  const totalStories = topics.reduce((sum, topic) => sum + (topic.stories?.[0]?.count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white">

      {/* Sticky top nav bar - refined */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-4">
          <Link
            href="/dashboard/channels"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 transition-all duration-200 flex-shrink-0 group"
            aria-label="Back to Channels"
          >
            <FaArrowLeft className="text-sm group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {channel.name}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              Channel Dashboard
            </p>
          </div>
          {/* Quick stats in nav */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full">
              <FaLayerGroup className="text-orange-500 text-[10px]" />
              <span className="font-medium text-gray-700">{topics.length}</span>
              <span className="text-gray-500">topics</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
              <FaFileAlt className="text-emerald-500 text-[10px]" />
              <span className="font-medium text-gray-700">{totalStories}</span>
              <span className="text-gray-500">stories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Banner only, no overlapping content */}
      <div className="relative">
        <div className="relative w-full h-48 sm:h-64 lg:h-72 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 overflow-hidden group">
          <ChannelMediaUpload 
            channelId={id} 
            type="banner" 
            currentUrl={channel.channel_banner_url} 
            channelName={channel.name} 
          />
        </div>
      </div>

      {/* Channel info section - Below banner, no overlap */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Avatar and channel info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Avatar */}
            <ChannelMediaUpload 
              channelId={id} 
              type="picture" 
              currentUrl={channel.channel_picture_url} 
              channelName={channel.name} 
            />

            {/* Name and description */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {channel.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 w-fit">
                  <FaVideo className="text-[10px]" />
                  {channel_type}
                </span>
              </div>
              {channel.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {channel.description}
                </p>
              )}

              {/* Stats row for mobile */}
              <div className="flex items-center gap-4 mt-3 sm:hidden">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FaLayerGroup className="text-orange-400" />
                  <span>{topics.length} topics</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <FaFileAlt className="text-emerald-400" />
                  <span>{totalStories} stories</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions Bar - Improved with better spacing and visual hierarchy ── */}
      <div className="sticky top-[57px] z-10 bg-white/90 backdrop-blur-md border-b border-orange-100/60 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex gap-3 max-w-5xl mx-auto">
          <GenerateTopicsButton channelId={id} />
          <Link
            href={`/dashboard/channels/${id}/${channel_type}/topics/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 active:scale-95"
          >
            <FaPlus className="text-xs" />
            <span>Create Topic</span>
          </Link>
        </div>
      </div>

      {/* ── Topics List - Redesigned with cards and better visual hierarchy ── */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Section header - Enhanced */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
              <FaLayerGroup className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Topics</h3>
              <p className="text-sm text-gray-500">Organize your video ideas and stories</p>
            </div>
            <span className="ml-auto text-sm font-medium text-gray-700 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200 shadow-sm">
              {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>

          {topics.length === 0 ? (
            /* Empty state - More engaging */
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-orange-200 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <FaLayerGroup className="text-3xl text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No topics yet</h3>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                Topics help you organize your video ideas into manageable groups.
                Create your first topic to start building your content strategy.
              </p>
              <Link
                href={`/dashboard/channels/${id}/${channel_type}/topics/new`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <FaPlus className="text-xs" />
                Create your first topic
              </Link>
            </div>
          ) : (
            /* Topics grid/cards - Modern card design */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300"
                >
                  <div className="p-5">
                    {/* Header with topic number and badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-600">#{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <FaFileAlt className="text-emerald-500 text-[9px]" />
                            <span className="text-xs font-medium text-emerald-700">
                              {topic.stories?.[0]?.count || 0} stories
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action menu button */}
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <FaEllipsisH className="text-xs" />
                      </button>
                    </div>

                    {/* Topic content */}
                    <Link
                      href={`/dashboard/channels/${id}/${channel_type}/topics/${topic.id}`}
                      className="block focus:outline-none"
                    >
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-1 line-clamp-1">
                        {topic.name}
                      </h4>
                      {topic.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {topic.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {topic.created_at && (
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="text-[10px]" />
                            <span>{formatDate(topic.created_at)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FaChartLine className="text-[10px]" />
                          <span>{Math.floor(Math.random() * 50)}% complete</span>
                        </div>
                      </div>
                    </Link>

                    {/* Footer with delete button */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                      <DeleteTopicButton topicId={topic.id} channelId={id} channelType={channel_type} />
                    </div>
                  </div>

                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick tip footer */}
      <div className="px-4 py-6 border-t border-orange-100 bg-white/50">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-gray-400">
            💡 Tip: Topics help you organize your content. Create multiple topics to categorize your stories effectively.
          </p>
        </div>
      </div>
    </div>
  );
}