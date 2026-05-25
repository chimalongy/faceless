'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FaTv,
  FaFileAlt,
  FaChevronDown,
  FaChevronRight,
  FaCheckCircle,
  FaSpinner,
  FaFolder,
  FaFolderOpen,
} from 'react-icons/fa';

// ── Utility: extract IDs from pathname ──────────────────────────────────────
function parsePathIds(pathname) {
  const channelMatch = pathname.match(/\/channels\/([^/]+)/);
  const topicMatch = pathname.match(/\/topics\/([^/]+)/);
  const storyMatch = pathname.match(/\/stories\/([^/]+)/);
  return {
    channelId: channelMatch?.[1] ?? null,
    topicId: topicMatch?.[1] ?? null,
    storyId: storyMatch?.[1] ?? null,
  };
}

// ── Story row ────────────────────────────────────────────────────────────────
function StoryItem({ story, channelId, channelType, topicId, activeStoryId }) {
  const href = `/dashboard/channels/${channelId}/${channelType}/topics/${topicId}/stories/${story.id}`;
  const isActive = story.id === activeStoryId;

  return (
    <Link
      href={href}
      title={story.title}
      className={`flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-[12px] transition-all group relative ${
        isActive
          ? 'bg-orange-100 text-orange-700 font-semibold'
          : 'text-stone-500 hover:text-stone-900 hover:bg-orange-50/60'
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-orange-500" />
      )}
      <FaFileAlt
        className={`flex-shrink-0 text-[10px] ${
          isActive ? 'text-orange-500' : 'text-stone-300 group-hover:text-orange-400'
        }`}
      />
      <span className="truncate leading-tight">{story.title}</span>
      {story.script_generated && (
        <FaCheckCircle className="flex-shrink-0 ml-auto text-[9px] text-emerald-500" title="Script ready" />
      )}
    </Link>
  );
}

// ── Topic row (collapsible) ──────────────────────────────────────────────────
function TopicItem({ topic, channelId, channelType, activeTopicId, activeStoryId }) {
  const isActiveTopic = topic.id === activeTopicId;
  const [open, setOpen] = useState(isActiveTopic);

  // Auto-open if this topic becomes active
  useEffect(() => {
    if (isActiveTopic) setOpen(true);
  }, [isActiveTopic]);

  const href = `/dashboard/channels/${channelId}/${channelType}/topics/${topic.id}`;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group ${
          isActiveTopic
            ? 'bg-orange-50 text-orange-600'
            : 'text-stone-500 hover:text-stone-800 hover:bg-gray-50'
        }`}
      >
        {/* Chevron toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
          aria-label={open ? 'Collapse topic' : 'Expand topic'}
        >
          {open ? (
            <FaChevronDown className="text-[9px]" />
          ) : (
            <FaChevronRight className="text-[9px]" />
          )}
        </button>

        <Link href={href} className="flex items-center gap-2 flex-1 min-w-0 no-underline" title={topic.name}>
          {open ? (
            <FaFolderOpen className={`flex-shrink-0 text-[12px] ${isActiveTopic ? 'text-orange-500' : 'text-amber-400'}`} />
          ) : (
            <FaFolder className={`flex-shrink-0 text-[12px] ${isActiveTopic ? 'text-orange-500' : 'text-amber-400'}`} />
          )}
          <span className={`truncate text-[12px] font-medium leading-tight ${isActiveTopic ? 'text-orange-600' : ''}`}>
            {topic.name}
          </span>
          <span className="ml-auto flex-shrink-0 text-[10px] font-medium text-stone-400">
            {topic.stories.length}
          </span>
        </Link>
      </div>

      {/* Stories list */}
      {open && topic.stories.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {topic.stories.map((story) => (
            <StoryItem
              key={story.id}
              story={story}
              channelId={channelId}
              channelType={channelType}
              topicId={topic.id}
              activeStoryId={activeStoryId}
            />
          ))}
        </div>
      )}

      {open && topic.stories.length === 0 && (
        <p className="pl-9 pr-3 py-1.5 text-[11px] text-stone-400 italic">No stories yet</p>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ChannelSidebarTree() {
  const pathname = usePathname();
  const { channelId, topicId, storyId } = parsePathIds(pathname);

  const [data, setData] = useState({ channel: null, topics: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (cid) => {
    if (!cid) {
      setData({ channel: null, topics: [] });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sidebar-data?channelId=${cid}`);
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError('Could not load channel data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever channelId changes OR pathname changes (new story created etc.)
  useEffect(() => {
    fetchData(channelId);
  }, [channelId, pathname, fetchData]);

  // Not inside a channel — render nothing (the normal nav handles this)
  if (!channelId) return null;

  const channelType = data.channel?.channel_type ?? 'v1';
  const channelHref = `/dashboard/channels/${channelId}/${channelType}`;

  return (
    <div className="mt-2 mb-1">
      {/* Divider */}
      <div className="mx-3 mb-2 border-t border-orange-50" />

      {/* Section label */}
      <p className="px-3 mb-1 text-[10px] font-bold tracking-widest text-orange-400 uppercase">
        Current Channel
      </p>

      {loading && (
        <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-stone-400">
          <FaSpinner className="animate-spin text-orange-400" />
          <span>Loading…</span>
        </div>
      )}

      {error && (
        <p className="px-3 py-1 text-[11px] text-red-400">{error}</p>
      )}

      {!loading && data.channel && (
        <div className="space-y-0.5">
          {/* Channel row */}
          <Link
            href={channelHref}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              pathname === channelHref || pathname.startsWith(`${channelHref}/`)
                ? 'bg-orange-50 text-orange-600'
                : 'text-stone-600 hover:text-stone-900 hover:bg-gray-50'
            }`}
          >
            <FaTv className="flex-shrink-0 text-orange-500 text-[13px]" />
            <span className="truncate">{data.channel.name}</span>
          </Link>

          {/* Topics */}
          {data.topics.length > 0 ? (
            <div className="space-y-0.5 pl-2">
              {data.topics.map((topic) => (
                <TopicItem
                  key={topic.id}
                  topic={topic}
                  channelId={channelId}
                  channelType={channelType}
                  activeTopicId={topicId}
                  activeStoryId={storyId}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <p className="pl-8 text-[11px] text-stone-400 italic py-1">No topics yet</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
