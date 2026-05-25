// src/app/dashboard/channels/ChannelAccordionList.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    FaTv,
    FaLayerGroup,
    FaChevronDown,
    FaExternalLinkAlt,
} from 'react-icons/fa';
import DeleteChannelButton from './DeleteChannelButton';

export default function ChannelAccordionList({ channels }) {
    return (
        <div>
            <h2
                className="text-[16px] font-bold text-stone-900 tracking-tight mb-4"
                style={{ fontFamily: "'Syne', sans-serif" }}
            >
                Your Channels
            </h2>
            <div className="space-y-3">
                {channels.map((channel) => (
                    <ChannelAccordionItem key={channel.id} channel={channel} />
                ))}
            </div>
        </div>
    );
}

function ChannelAccordionItem({ channel }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? 'border-orange-200 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]'
                }`}
        >
            {/* ── HEADER (always visible) ── */}
            <div className="flex items-center justify-between p-5 sm:p-6">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between text-left cursor-pointer group min-w-0"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isOpen
                                ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md'
                                : 'bg-orange-50 group-hover:bg-orange-100'
                                }`}
                        >
                            <FaTv
                                className={`text-lg transition-colors ${isOpen ? 'text-white' : 'text-orange-500'}`}
                            />
                        </div>
                        <div className="min-w-0">
                            <h3
                                className={`text-[15px] font-bold truncate transition-colors ${isOpen ? 'text-orange-600' : 'text-stone-900 group-hover:text-orange-600'
                                    }`}
                            >
                                {channel.name}
                            </h3>
                            <p className="text-[12px] text-gray-400">
                                {channel.channel_type === 'youtube' ? 'YouTube Channel' : 'Custom Channel'}
                                <span className="mx-1.5 text-gray-300">·</span>
                                <span
                                    className={`inline-flex items-center gap-1 ${channel.status === 'active' ? 'text-emerald-500' : 'text-gray-400'
                                        }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${channel.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                                            }`}
                                    />
                                    {channel.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        {/* Topic count badge */}
                        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <FaLayerGroup className="text-emerald-500 text-[10px]" />
                            <span className="text-[12px] font-semibold text-emerald-700">
                                {channel.topics?.[0]?.count || 0}
                            </span>
                        </div>

                        {/* Chevron */}
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-orange-100 rotate-180' : 'bg-gray-50 group-hover:bg-orange-50'
                                }`}
                        >
                            <FaChevronDown
                                className={`text-sm transition-colors ${isOpen ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'
                                    }`}
                            />
                        </div>
                    </div>
                </button>

                {/* ── OPEN CHANNEL BUTTON ── */}
                <Link
                    href={`/dashboard/channels/${channel.id}/v1/`}
                    className="ml-3 flex-shrink-0 inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[12px] font-semibold px-3 py-2 rounded-lg shadow-sm shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FaExternalLinkAlt className="text-[10px]" />
                    <span className="hidden sm:inline">Open</span>
                </Link>
            </div>

            {/* ── EXPANDED CONTENT ── */}
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <div className="border-t border-orange-100 pt-4">
                        {/* Description — scrollable with max height */}
                        <div className="mb-5">
                            {channel.description ? (
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    <p className="text-[14px] text-stone-600 leading-relaxed">
                                        {channel.description}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[14px] text-stone-400 italic">
                                    No description added for this channel.
                                </p>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 mb-5">
                            <div className="flex items-center gap-2 text-[12px] text-gray-500">
                                <FaLayerGroup className="text-emerald-500" />
                                <span>
                                    <strong className="text-stone-900">{channel.topics?.[0]?.count || 0}</strong> topics
                                </span>
                            </div>
                            <div className="w-px h-4 bg-gray-200" />
                            <div className="flex items-center gap-2 text-[12px] text-gray-500">
                                <FaTv className="text-orange-500" />
                                <span className="capitalize">{channel.channel_type}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/dashboard/channels/${channel.id}/${channel.channel_type}`}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all no-underline flex-1 justify-center sm:flex-none"
                            >
                                <FaExternalLinkAlt className="text-xs" />
                                Enter Channel
                            </Link>

                            <div className="ml-auto">
                                <DeleteChannelButton channelId={channel.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}