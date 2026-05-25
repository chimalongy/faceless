// src/app/dashboard/channels/page.js
import Link from 'next/link';
import { getChannels } from '../../../lib/actions';
import {
  FaPlus,
  FaTv,
  FaLayerGroup,
  FaYoutube,
  FaArrowRight,
} from 'react-icons/fa';
import ChannelAccordionList from './ChannelAccordionList';

export default async function ChannelsPage() {
  const channels = await getChannels();

  const totalTopics = channels.reduce((acc, ch) => acc + (ch.topics?.[0]?.count || 0), 0);
  const activeChannels = channels.filter((ch) => ch.status === 'active').length;

  const statCards = [
    {
      label: 'Channels',
      value: channels.length,
      icon: <FaTv className="text-sm" />,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      accent: 'border-orange-500',
    },
    {
      label: 'Topics',
      value: totalTopics,
      icon: <FaLayerGroup className="text-sm" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      accent: 'border-amber-500',
    },
    {
      label: 'Active',
      value: activeChannels,
      icon: <FaYoutube className="text-sm" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-emerald-500',
    },
  ];

  return (
    <div className="space-y-8 pb-10 px-2">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
            Management
          </p>
          <h1
            className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Channels
          </h1>
          <p className="text-[15px] text-stone-400 mt-1">
            Manage all your YouTube channels in one place.
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

      {/* ── COMPACT STAT CARDS ── */}
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
            <p className="text-[11px] sm:text-[13px] font-medium text-gray-400 mb-1">{card.label}</p>
            <p
              className="text-[24px] sm:text-[36px] font-extrabold text-stone-900 leading-none tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── CHANNELS ACCORDION or EMPTY STATE ── */}
      {channels.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-orange-200 p-10 text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaTv className="text-orange-500 text-xl" />
          </div>
          <h2
            className="text-[20px] font-extrabold text-stone-900 tracking-tight mb-2"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            No channels yet
          </h2>
          <p className="text-[15px] text-stone-400 mb-7 max-w-xs mx-auto">
            Get started by creating your first YouTube channel.
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
        <ChannelAccordionList channels={channels} />
      )}



    </div>
  );
}