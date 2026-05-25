// src/app/dashboard/page.js
import { supabase } from '../../lib/supabase';
import { getSessionCookie } from '../../lib/auth';
import Link from 'next/link';
import {
  FaTv,
  FaLayerGroup,
  FaFileAlt,
  FaPlus,
  FaArrowRight,
  FaMagic,
  FaRocket,
  FaChartLine,
} from 'react-icons/fa';

async function getStats(userId) {
  const [channels, topics, stories] = await Promise.all([
    supabase.from('channels').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('topics').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  return {
    channels: channels.count || 0,
    topics: topics.count || 0,
    stories: stories.count || 0,
  };
}

export default async function DashboardPage() {
  const userId = await getSessionCookie();

  if (!userId) {
    return <div>Loading...</div>;
  }

  const stats = await getStats(userId);

  const isEmpty = stats.channels === 0 && stats.topics === 0 && stats.stories === 0;

  const statCards = [
    {
      label: 'Total Channels',
      value: stats.channels,
      icon: <FaTv className="text-lg" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      accent: 'border-orange-500',
      href: '/dashboard/channels',
      trend: 'View all channels',
    },
    {
      label: 'Active Topics',
      value: stats.topics,
      icon: <FaLayerGroup className="text-lg" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      accent: 'border-amber-500',
      href: '/dashboard/topics',
      trend: 'View all topics',
    },
    {
      label: 'Stories Created',
      value: stats.stories,
      icon: <FaFileAlt className="text-lg" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-emerald-500',
      href: '/dashboard/stories',
      trend: 'View all stories',
    },
  ];

  const quickActions = [
    {
      icon: <FaTv className="text-xl" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      title: 'New Channel',
      desc: 'Set up a new YouTube channel profile',
      href: '/dashboard/channels/new',
    },
    {
      icon: <FaLayerGroup className="text-xl" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      title: 'New Topic',
      desc: 'Organise content into a new topic',
      href: '/dashboard/topics/new',
    },
    {
      icon: <FaMagic className="text-xl" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      title: 'Generate Script',
      desc: 'Turn a story into a YouTube script',
      href: '/dashboard/stories/new',
    },
  ];

  return (
    <div className="space-y-8 pb-10 px-2">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
            Overview
          </p>
          <h1
            className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Dashboard
          </h1>
          <p className="text-[15px] text-stone-400 mt-1">
            Welcome back — here's what's happening with your studio.
          </p>
        </div>
        <Link
          href="/dashboard/channels/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline self-start sm:self-auto flex-shrink-0"
        >
          <FaPlus className="text-xs" />
          New Channel
        </Link>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-2" >
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 no-underline block"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center ${card.iconColor}`}>
                {card.icon}
              </div>
              <span className={`w-1 h-8 rounded-full ${card.accent} opacity-70`} />
            </div>
            <p className="text-[13px] font-medium text-gray-400 mb-1">{card.label}</p>
            <p
              className="text-[36px] font-extrabold text-stone-900 leading-none tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {card.value}
            </p>
            <p className="text-[12px] text-gray-400 mt-3 group-hover:text-orange-500 transition-colors flex items-center gap-1">
              {card.trend} <FaArrowRight className="text-[10px]" />
            </p>
          </Link>
        ))}
      </div>

      {/* ── EMPTY STATE or QUICK ACTIONS ── */}
      {isEmpty ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-orange-200 p-10 text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaRocket className="text-orange-500 text-xl" />
          </div>
          <h2
            className="text-[20px] font-extrabold text-stone-900 tracking-tight mb-2"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Ready to create content?
          </h2>
          <p className="text-[15px] text-stone-400 mb-7 max-w-xs mx-auto">
            Start by creating your first channel and let AI generate scripts for you.
          </p>
          <Link
            href="/dashboard/channels/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline"
          >
            <FaPlus className="text-xs" />
            Create Your First Channel
          </Link>
        </div>
      ) : (
        /* Quick actions — shown once the user has data */
        <div>
          <h2
            className="text-[16px] font-bold text-stone-900 tracking-tight mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 no-underline flex items-start gap-4"
              >
                <div className={`w-10 h-10 ${action.iconBg} rounded-xl flex items-center justify-center ${action.iconColor} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-stone-900 mb-0.5">{action.title}</p>
                  <p className="text-[13px] text-stone-400 leading-snug">{action.desc}</p>
                </div>
                <FaArrowRight className="text-[12px] text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all ml-auto self-center flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── GET STARTED GUIDE (always visible) ── */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-7 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -right-10 w-[220px] h-[220px] rounded-full bg-orange-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-6 w-[180px] h-[180px] rounded-full bg-amber-500/8 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="text-orange-500 text-sm" />
              <span className="text-[12px] font-bold tracking-[0.1em] text-orange-500 uppercase">
                How it works
              </span>
            </div>
            <h3
              className="text-[20px] font-extrabold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              3 steps to your first script
            </h3>
            <div className="flex flex-col gap-2 mt-3">
              {[
                'Create a channel with your niche',
                'Add topics to organise your ideas',
                'Write a story and generate a script',
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-stone-300">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/dashboard/channels/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[14px] px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px transition-all no-underline self-start sm:self-center flex-shrink-0"
          >
            Get Started
            <FaArrowRight className="text-xs" />
          </Link>
        </div>
      </div>

    </div>
  );
}