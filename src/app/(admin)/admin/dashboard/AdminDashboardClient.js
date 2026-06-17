'use client';

import { useState } from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { FaChartBar, FaBolt } from 'react-icons/fa';
import TriggerSwitchTab from './TriggerSwitchTab';

const TABS = [
  { id: 'overview',        label: 'Overview',        icon: <FaChartBar className="text-xs" /> },
  { id: 'trigger-switch',  label: 'Trigger Switch',  icon: <FaBolt className="text-xs" /> },
];

export default function AdminDashboardClient({ overviewContent }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-8">

      {/* ── Page heading + tab bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div className="flex items-center gap-3">
          <HiSparkles className="text-indigo-400 text-xl" />
          <div>
            <h1
              className="text-[26px] font-extrabold text-white tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Admin Dashboard
            </h1>
            <p className="text-[13px] text-slate-500">Platform overview and management</p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-700/60 rounded-xl self-start sm:self-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div>
        {activeTab === 'overview'       && overviewContent}
        {activeTab === 'trigger-switch' && <TriggerSwitchTab />}
      </div>
    </div>
  );
}
