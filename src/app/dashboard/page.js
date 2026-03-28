// src/app/dashboard/page.js
import { supabase } from '../../lib/supabase';
import { getSessionCookie } from '../../lib/auth';
import Link from 'next/link';
import { FaTv, FaLayerGroup, FaFileAlt, FaPlus } from 'react-icons/fa';

async function getStats(userId) {
  // Parallel fetching of counts
  // Note: supabase.from(...).select('*', { count: 'exact', head: true }) is efficient
  
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
  
  // Since we are server-side, we should technically handle if userId is missing (though middleware handles it)
  // But for the stats query, we need it.
  if (!userId) {
    return <div>Loading...</div>; // Should be handled by middleware
  }

  const stats = await getStats(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-gray-500 mt-2">Welcome back to your creative studio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-orange-500 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Channels</p>
              <h3 className="text-3xl font-bold mt-2 text-gray-900">{stats.channels}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-500">
              <FaTv className="text-xl" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-amber-500 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Topics</p>
              <h3 className="text-3xl font-bold mt-2 text-gray-900">{stats.topics}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-500">
              <FaLayerGroup className="text-xl" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Stories Created</p>
              <h3 className="text-3xl font-bold mt-2 text-gray-900">{stats.stories}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-500">
              <FaFileAlt className="text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-8 text-center border-dashed border-2 border-orange-200 bg-orange-50/30">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Ready to create content?</h2>
        <p className="text-gray-500 mb-6">Start by creating a new channel for your videos.</p>
        <Link 
          href="/dashboard/channels/new" 
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/20"
        >
          <FaPlus />
          Create New Channel
        </Link>
      </div>
    </div>
  );
}
