import { redirect } from 'next/navigation';
import { getAdminCookie } from '../../../../lib/adminAuth';
import { supabase } from '../../../../lib/supabase';
import {
  FaUsers, FaYoutube, FaBookOpen, FaRobot,
  FaShieldAlt, FaCheckCircle, FaClock, FaServer, FaBrain,
} from 'react-icons/fa';
import AdminLogoutButton from './AdminLogoutButton';
import AdminDashboardClient from './AdminDashboardClient';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  const accents = {
    indigo:  'from-indigo-500 to-violet-600 shadow-indigo-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    amber:   'from-amber-500 to-orange-500 shadow-amber-500/20',
    rose:    'from-rose-500 to-pink-600 shadow-rose-500/20',
  };
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <span className="text-white text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-[28px] font-extrabold text-white tracking-tight leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
          {value}
        </p>
        {sub && <p className="text-[12px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────────────────────
function Pill({ children, color }) {
  const map = {
    green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/10   text-amber-400   border-amber-500/20',
    slate:  'bg-slate-500/10   text-slate-400   border-slate-500/20',
    red:    'bg-rose-500/10    text-rose-400     border-rose-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${map[color]}`}>
      {children}
    </span>
  );
}

// ── Page (Server Component) ───────────────────────────────────────────────────
export default async function AdminDashboardPage() {
  const isAdmin = await getAdminCookie();
  if (!isAdmin) redirect('/admin/login');

  const [
    { count: userCount },
    { count: channelCount },
    { count: storyCount },
    { count: topicCount },
    { data: recentUsers },
    { data: llmApis },
    { data: recentStories },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('channels').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('id, email, first_name, last_name, created_at, role').order('created_at', { ascending: false }).limit(8),
    supabase.from('llm_apis').select('*').order('created_at', { ascending: false }),
    supabase.from('stories').select('id, title, post_status, completion_status, created_at').order('created_at', { ascending: false }).limit(6),
  ]);

  const publishedStories = recentStories?.filter((s) => s.post_status === 'true').length ?? 0;
  const scheduledStories = recentStories?.filter((s) => s.post_status === 'scheduled').length ?? 0;

  // ── Overview JSX (server-rendered, passed to client shell as children) ────
  const overviewContent = (
    <div className="space-y-8">

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<FaUsers />}    label="Total Users"  value={userCount ?? 0}    sub="Registered accounts"             accent="indigo" />
        <StatCard icon={<FaYoutube />}  label="Channels"     value={channelCount ?? 0} sub="Across all users"                accent="rose"   />
        <StatCard icon={<FaBookOpen />} label="Topics"       value={topicCount ?? 0}   sub="Content categories"              accent="amber"  />
        <StatCard icon={<FaRobot />}    label="Stories"      value={storyCount ?? 0}   sub={`${publishedStories} published`} accent="emerald" />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Users */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <FaUsers className="text-indigo-400" />
              <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Recent Users</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">{userCount} total</span>
          </div>
          <div className="divide-y divide-slate-800">
            {!recentUsers?.length && <p className="px-6 py-8 text-center text-slate-500 text-sm">No users yet.</p>}
            {recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-800/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">
                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <Pill color={user.role === 'admin' ? 'red' : 'slate'}>{user.role || 'user'}</Pill>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LLM APIs */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <FaBrain className="text-violet-400" />
              <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>LLM API Keys</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">{llmApis?.length ?? 0} configured</span>
          </div>
          <div className="divide-y divide-slate-800">
            {!llmApis?.length && <p className="px-6 py-8 text-center text-slate-500 text-sm">No LLM APIs configured.</p>}
            {llmApis?.map((api) => (
              <div key={api.id} className="flex items-start gap-3 px-6 py-4 hover:bg-slate-800/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaServer className="text-violet-400 text-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-[13px] font-semibold text-white">{api.model_name}</p>
                    <Pill color="green">{api.llm_provider}</Pill>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{api.email}</p>
                  <p className="text-[11px] text-slate-600 font-mono">{api.llm_api?.slice(0, 8)}••••••••</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] text-slate-500">Used {api.usage_count ?? 0}×</p>
                  {api.last_used && (
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(api.last_used).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Stories */}
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FaYoutube className="text-rose-400" />
            <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Recent Stories</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <FaCheckCircle className="text-[9px]" /> {publishedStories} published
            </span>
            {scheduledStories > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold">
                <FaClock className="text-[9px]" /> {scheduledStories} scheduled
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-800">
          {!recentStories?.length && <p className="px-6 py-8 text-center text-slate-500 text-sm">No stories yet.</p>}
          {recentStories?.map((story) => (
            <div key={story.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-800/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{story.title}</p>
                <p className="text-[11px] text-slate-500">
                  {new Date(story.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {story.completion_status           && <Pill color="green">Video Ready</Pill>}
                {story.post_status === 'true'      && <Pill color="green">Published</Pill>}
                {story.post_status === 'scheduled' && <Pill color="yellow">Scheduled</Pill>}
                {story.post_status === 'false'     && <Pill color="slate">Draft</Pill>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-indigo-600/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <FaShieldAlt className="text-white text-xs" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                FacelessVidStudio
              </p>
              <p className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase -mt-0.5">Admin Panel</p>
            </div>
          </div>
          <AdminLogoutButton />
        </div>
      </header>

      {/* Main — client component owns the tab state */}
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <AdminDashboardClient overviewContent={overviewContent} />
      </main>
    </div>
  );
}
