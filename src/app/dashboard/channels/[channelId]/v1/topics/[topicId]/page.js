// src/app/dashboard/channels/[channelId]/[channelType]/topics/[topicId]/page.js
import Link from 'next/link';
import { getTopic } from '../../../../../../../lib/actions';
import { supabase } from '../../../../../../../lib/supabase';
import {
  FaArrowLeft,
  FaPlus,
  FaFileAlt,
  FaMagic,
  FaClock,
  FaMusic,
  FaRobot,
  FaArrowRight,
  FaCheckCircle,
  FaSpinner,
} from 'react-icons/fa';
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

  const statCards = [
    {
      label: 'Stories',
      value: stories.length,
      icon: <FaFileAlt className="text-sm" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      accent: 'border-orange-500',
      trend: 'Total stories',
    },
    {
      label: 'Scripted',
      value: scriptedCount,
      icon: <FaCheckCircle className="text-sm" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-emerald-500',
      trend: 'AI generated',
    },
    {
      label: 'Progress',
      value: `${completionRate}%`,
      icon: <FaSpinner className="text-sm" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      accent: 'border-amber-500',
      trend: 'Completion',
    },
  ];

  return (
    <div className="space-y-8 pb-10 px-2">

      {/* ── BACK LINK ── */}
      <Link
        href={`/dashboard/channels/${channelId}/${channel.channel_type}`}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-400 hover:text-orange-500 transition-colors no-underline"
      >
        <FaArrowLeft className="text-xs" />
        Back to {channel.name}
      </Link>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          <h1
            className="text-[22px] sm:text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {topic.name}
          </h1>
          {topic.description && (
            <p className="text-[14px] sm:text-[15px] text-stone-400 mt-1 line-clamp-2">
              {topic.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <Link
            href={`/dashboard/channels/${channelId}/v1/topics/${topicId}/background-music`}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-stone-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-all no-underline"
          >
            <FaMusic className="text-xs" />
            <span className="hidden sm:inline">Music</span>
          </Link>
          <Link
            href={`/dashboard/channels/${channelId}/${channel.channel_type}/topics/${topicId}/stories/new`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline"
          >
            <FaPlus className="text-xs" />
            New Story
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-3 gap-3 px-2">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 ${card.iconBg} rounded-xl flex items-center justify-center ${card.iconColor}`}
              >
                {card.icon}
              </div>
              <span className={`w-1 h-6 sm:h-8 rounded-full ${card.accent} opacity-70`} />
            </div>
            <p className="text-[11px] sm:text-[13px] font-medium text-gray-400 mb-1">
              {card.label}
            </p>
            <p
              className="text-[20px] sm:text-[28px] font-extrabold text-stone-900 leading-none tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {card.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
              {card.trend}
            </p>
          </div>
        ))}
      </div>

      {/* ── STORIES SECTION ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1">
              Content
            </p>
            <h2
              className="text-[16px] font-bold text-stone-900 tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Stories
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <GenerateStoriesButton topicId={topicId} channelId={channelId} />
          </div>
        </div>

        {stories.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-orange-200 p-10 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaFileAlt className="text-orange-500 text-xl" />
            </div>
            <h2
              className="text-[20px] font-extrabold text-stone-900 tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              No stories yet
            </h2>
            <p className="text-[15px] text-stone-400 mb-7 max-w-sm mx-auto">
              Start writing your script ideas here. Each story can be turned into a full video script with AI assistance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/dashboard/channels/${channelId}/${channel.channel_type}/topics/${topicId}/stories/new`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[14px] px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline"
              >
                <FaPlus className="text-xs" />
                Create First Story
              </Link>
              <GenerateStoriesButton topicId={topicId} channelId={channelId} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {stories.map((story) => (
              <div
                key={story.id}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Bottom accent bar on hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left pointer-events-none" />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/dashboard/channels/${channelId}/${channel.channel_type}/topics/${topicId}/stories/${story.id}`}
                      className="flex-1 min-w-0 no-underline group/link"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {story.script_generated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600 flex-shrink-0">
                            <FaMagic className="text-[8px]" />
                            AI Ready
                          </span>
                        )}
                        <h3 className="text-[15px] font-bold text-stone-900 group-hover/link:text-orange-600 transition-colors truncate">
                          {story.title}
                        </h3>
                      </div>

                      {story.content && (
                        <p className="text-[13px] text-stone-400 line-clamp-2 mb-3 leading-snug">
                          {story.content}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[12px] text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <FaClock className="text-[10px]" />
                          <span>{formatDate(story.created_at)}</span>
                        </span>
                        {story.script_generated && (
                          <span className="flex items-center gap-1.5 text-emerald-500">
                            <FaRobot className="text-[10px]" />
                            <span>Script generated</span>
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <FaArrowRight className="text-[12px] text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                      <DeleteStoryButton
                        storyId={story.id}
                        topicId={topicId}
                        channelId={channelId}
                        channelType={channel.channel_type}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



    </div>
  );
}