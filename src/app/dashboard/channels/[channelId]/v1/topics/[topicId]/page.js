import Link from 'next/link';
import { getTopic } from '../../../../../../../lib/actions';
import { supabase } from '../../../../../../../lib/supabase';
import { FaArrowLeft, FaPlus, FaFileAlt, FaMagic, FaClock, FaMusic, FaRobot, FaChevronRight, FaEllipsisV } from 'react-icons/fa';
import { notFound } from 'next/navigation';
import { getChannel } from '../../../../../../../lib/actions';
import GenerateStoriesButton from './GenerateStoriesButton';
import DeleteStoryButton from './DeleteStoryButton';

// Fetch stories directly here for now
async function getStories(topicId) {
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false });
  return data || [];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function TopicDetailsPage({ params }) {
  const { channelId, topicId } = await params;
  const [channel] = await Promise.all([
    getChannel(channelId),
  ]);

  const [topic, stories] = await Promise.all([
    getTopic(topicId),
    getStories(topicId)
  ]);

  if (!topic) {
    notFound();
  }

  const scriptedCount = stories.filter(s => s.script_generated).length;
  const completionRate = stories.length > 0 ? Math.round((scriptedCount / stories.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-orange-100/50 shadow-sm">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/channels/${channelId}/${channel.channel_type}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              aria-label="Back to Channel"
            >
              <FaArrowLeft className="text-sm" />
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="truncate">{channel.name}</span>
                <FaChevronRight className="text-xs text-gray-400" />
                <span className="truncate text-orange-600 font-medium">{topic.name}</span>
              </div>
            </div>

            {/* Mobile Actions Menu (simplified) */}
            <div className="sm:hidden">
              <button className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                <FaEllipsisV className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Topic Header Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-orange-100/60 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full border border-amber-200">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-amber-800">Active Topic</span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                    {topic.name}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 max-w-3xl leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                {/* Mobile Stats */}
                <div className="flex flex-wrap items-center gap-4 sm:hidden">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <FaFileAlt className="text-emerald-500 text-xs" />
                    <span className="text-sm font-medium text-emerald-700">{stories.length}</span>
                    <span className="text-xs text-emerald-600">stories</span>
                  </div>

                  {stories[0] && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FaClock className="text-amber-500" />
                      <span>Last {formatDate(stories[0].created_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Link
                  href={`/dashboard/channels/${channelId}/v1/topics/${topicId}/background-music`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl active:scale-[0.98] text-sm sm:text-base"
                >
                  <FaMusic />
                  <span className="hidden sm:inline">Background Music</span>
                  <span className="sm:hidden">Music</span>
                </Link>

                <GenerateStoriesButton topicId={topicId} channelId={channelId} />

                <Link
                  href={`/dashboard/channels/${channelId}/${channel.channel_type}/topics/${topicId}/stories/new`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
                >
                  <FaPlus />
                  <span>New Story</span>
                </Link>
              </div>
            </div>

            {/* Progress Bar */}
            {stories.length > 0 && (
              <div className="mt-6 pt-6 border-t border-orange-100/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-600">Script Generation Progress</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{completionRate}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {scriptedCount} of {stories.length} stories have scripts generated
                </p>
              </div>
            )}
          </div>

          {/* Stories Section */}
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
                  <FaFileAlt className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Stories</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Manage your story ideas and scripts</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-600">
                  {stories.length} total
                </span>
              </div>
            </div>

            {stories.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-amber-200 p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100">
                    <FaFileAlt className="text-3xl text-amber-600" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">No stories yet</h3>
                    <p className="text-sm text-gray-600">
                      Start writing your script ideas here. Each story can be turned into a full video script with AI assistance.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={`/dashboard/channels/${channelId}/${channel.channel_type}/topics/${topicId}/stories/new`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl"
                    >
                      <FaPlus />
                      Create your first story
                    </Link>

                    <GenerateStoriesButton topicId={topicId} channelId={channelId} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="group relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg overflow-hidden"
                  >
                    {/* Status Badge */}
                    {story.script_generated && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-200 shadow-sm">
                          <FaMagic className="text-emerald-600 text-[10px]" />
                          <span className="text-[10px] font-semibold text-emerald-700">AI Ready</span>
                        </div>
                      </div>
                    )}

                    {/* Delete Button - Always visible on mobile, hover on desktop */}
                    <div className="absolute top-3 left-3 z-10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <DeleteStoryButton
                        storyId={story.id}
                        topicId={topicId}
                        channelId={channelId}
                        channelType={channel.channel_type}
                      />
                    </div>

                    {/* Card Content */}
                    <Link
                      href={`/dashboard/channels/${channelId}/${channel.channel_type}/topics/${topicId}/stories/${story.id}`}
                      className="block p-5"
                    >
                      <div className="space-y-4">
                        {/* Title with proper padding for badges */}
                        <div className="pt-6 sm:pt-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 pr-16">
                            {story.title}
                          </h3>
                        </div>

                        {/* Preview */}
                        {story.content && (
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {story.content}
                          </p>
                        )}

                        {/* AI Generated Indicator */}
                        {story.script_generated && (
                          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg w-fit">
                            <FaRobot className="text-[10px]" />
                            <span className="text-[10px] font-medium">Script generated</span>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <FaClock />
                            <span>{formatDate(story.created_at)}</span>
                          </div>

                          <span className="text-xs font-medium text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
                            View
                            <FaChevronRight className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}