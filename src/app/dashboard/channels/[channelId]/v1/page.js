// src/app/dashboard/channels/[channelId]/[channelType]/page.js
import Link from 'next/link';
import { getChannel } from '../../../../../lib/actions';
import { supabase } from '../../../../../lib/supabase';
import {
  FaArrowLeft,
  FaPlus,
  FaLayerGroup,
  FaFileAlt,
  FaCalendarAlt,
  FaVideo,
  FaCog,
  FaArrowRight,
  FaRobot,
} from 'react-icons/fa';
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
    day: 'numeric',
  });
}

export default async function ChannelDetailsPage({ params }) {
  const id = (await params).channelId;
  const [channel, topics] = await Promise.all([
    getChannel(id),
    getTopics(id),
  ]);

  if (!channel) {
    notFound();
  }

  const channel_type = channel.channel_type;
  const totalStories = topics.reduce(
    (sum, topic) => sum + (topic.stories?.[0]?.count || 0),
    0
  );

  const statCards = [
    {
      label: 'Topics',
      value: topics.length,
      icon: <FaLayerGroup className="text-sm" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      accent: 'border-orange-500',
      trend: 'Total topics',
    },
    {
      label: 'Stories',
      value: totalStories,
      icon: <FaFileAlt className="text-sm" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-emerald-500',
      trend: 'Across all topics',
    },
    {
      label: 'Channel Type',
      value: channel_type.toUpperCase(),
      icon: <FaVideo className="text-sm" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      accent: 'border-amber-500',
      trend: 'Version',
    },
  ];

  return (
    <div className="space-y-8 pb-10 px-2">

      {/* ── BACK LINK ── */}
      <Link
        href="/dashboard/channels"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-400 hover:text-orange-500 transition-colors no-underline"
      >
        <FaArrowLeft className="text-xs" />
        Back to Channels
      </Link>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <ChannelMediaUpload
              channelId={id}
              type="picture"
              currentUrl={channel.channel_picture_url}
              channelName={channel.name}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
              {channel_type.toUpperCase()} Channel
            </p>
            <h1
              className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {channel.name}
            </h1>
            {channel.description && (
              <p className="text-[15px] text-stone-400 mt-1 line-clamp-2">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <Link
            href={`/dashboard/channels/${id}/v1/configure`}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-stone-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all no-underline"
          >
            <FaCog className="text-xs" />
            <span className="hidden sm:inline">Configure</span>
          </Link>
          <Link
            href={`/dashboard/channels/${id}/${channel_type}/topics/new`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline"
          >
            <FaPlus className="text-xs" />
            New Topic
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



      {/* ── TOPICS SECTION ── */}
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
              Topics
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <GenerateTopicsButton channelId={id} />
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-orange-200 p-10 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaLayerGroup className="text-orange-500 text-xl" />
            </div>
            <h2
              className="text-[20px] font-extrabold text-stone-900 tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              No topics yet
            </h2>
            <p className="text-[15px] text-stone-400 mb-7 max-w-xs mx-auto">
              Topics help you organize your video ideas into manageable groups.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/dashboard/channels/${id}/${channel_type}/topics/new`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[14px] px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline"
              >
                <FaPlus className="text-xs" />
                Create First Topic
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={topic.id}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Bottom accent bar on hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left pointer-events-none" />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/dashboard/channels/${id}/${channel_type}/topics/${topic.id}`}
                      className="flex-1 min-w-0 no-underline group/link"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <h3 className="text-[15px] font-bold text-stone-900 group-hover/link:text-orange-600 transition-colors truncate">
                          {topic.name}
                        </h3>
                      </div>

                      {topic.description && (
                        <p className="text-[13px] text-stone-400 line-clamp-2 mb-3 leading-snug">
                          {topic.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[12px] text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <FaFileAlt className="text-emerald-500 text-[10px]" />
                          <span className="text-stone-600 font-medium">
                            {topic.stories?.[0]?.count || 0}
                          </span>
                          <span>stories</span>
                        </span>
                        {topic.created_at && (
                          <span className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-[10px]" />
                            <span>{formatDate(topic.created_at)}</span>
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <FaArrowRight className="text-[12px] text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                      <DeleteTopicButton
                        topicId={topic.id}
                        channelId={id}
                        channelType={channel_type}
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