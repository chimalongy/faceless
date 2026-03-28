import Link from 'next/link';
import { getChannel } from '../../../../../lib/actions';
import { supabase } from '../../../../../lib/supabase';
import { FaArrowLeft, FaPlus, FaLayerGroup, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';
import { notFound } from 'next/navigation';
import GenerateTopicsButton from './GenerateTopicsButton';
import DeleteTopicButton from './DeleteTopicButton';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-orange-100/50 shadow-sm">
        <div className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Link
              href="/dashboard/channels"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              aria-label="Back to Channels"
            >
              <FaArrowLeft className="text-sm" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {channel.name}
              </h1>
            </div>
          </div>

          {channel.description && (
            <p className="text-sm text-gray-600 line-clamp-2 sm:line-clamp-none px-1">
              {channel.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="sticky top-[72px] sm:top-[88px] z-10 bg-white/60 backdrop-blur-sm border-b border-orange-100/30 px-3 py-3 sm:px-6">
        <div className="flex gap-2">
          <GenerateTopicsButton channelId={id} />
          <Link
            href={`/dashboard/channels/${id}/${channel_type}/topics/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:from-orange-600 hover:to-amber-600 transition-all active:scale-[0.98]"
          >
            <FaPlus className="text-xs" />
            <span>New Topic</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {/* Topics Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <FaLayerGroup className="text-white text-sm" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Topics</h2>
            <span className="ml-auto text-sm text-gray-500 bg-white/80 px-3 py-1 rounded-full border border-orange-100">
              {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>

          {topics.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border-2 border-dashed border-orange-200 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                <FaLayerGroup className="text-2xl text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No topics yet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Topics help you organize your video ideas. Create your first topic to get started.
              </p>
              <Link
                href={`/dashboard/channels/${id}/${channel_type}/topics/new`}
                className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-6 py-3 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors border border-orange-200"
              >
                <FaPlus className="text-xs" />
                Create your first topic
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="group bg-white/90 backdrop-blur-sm rounded-xl border border-orange-100/60 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {/* Topic Icon/Number */}
                      <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/channels/${id}/${channel_type}/topics/${topic.id}`}
                          className="block focus:outline-none focus:ring-2 focus:ring-orange-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors truncate">
                                {topic.name}
                              </h3>
                              {topic.description && (
                                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-0.5">
                                  {topic.description}
                                </p>
                              )}

                              {/* Mobile Meta Info */}
                              <div className="flex items-center gap-3 mt-2 sm:hidden">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                  <FaFileAlt className="text-emerald-500 text-[10px]" />
                                  <span>{topic.stories?.[0]?.count || 0} stories</span>
                                </div>
                                {topic.created_at && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <FaCalendarAlt className="text-gray-400 text-[10px]" />
                                    <span>{formatDate(topic.created_at)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Desktop Stats */}
                            <div className="hidden sm:flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100">
                                <FaFileAlt className="text-emerald-500 text-xs" />
                                <span className="font-medium text-emerald-700">
                                  {topic.stories?.[0]?.count || 0}
                                </span>
                                <span className="text-emerald-600">stories</span>
                              </div>
                              <div className="text-orange-300 group-hover:translate-x-1 group-hover:text-amber-500 transition-transform">
                                →
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100/60">
                      {/* Desktop Date */}
                      {topic.created_at && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                          <FaCalendarAlt className="text-gray-400" />
                          <span>Created {formatDate(topic.created_at)}</span>
                        </div>
                      )}

                      {/* Delete Topic Button Component */}
                      <DeleteTopicButton topicId={topic.id} channelId={id} channelType={channel_type} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
