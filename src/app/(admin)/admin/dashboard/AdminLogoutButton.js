'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    toast.success('Logged out of admin panel');
    router.push('/admin/login');
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      id="admin-logout-btn"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[13px] font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-60"
    >
      <FaSignOutAlt className="text-xs" />
      {loading ? 'Logging out…' : 'Logout'}
    </button>
  );
}
