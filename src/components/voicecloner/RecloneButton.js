'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaRedo } from 'react-icons/fa';

export default function RecloneButton({ cloneId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    if (!cloneId) return;
    setLoading(true);
    const t = toast.loading('Recloning…');

    try {
      const res = await fetch('/api/voice-clone/reclone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cloneId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reclone');

      toast.success('Reclone queued', { id: t });
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to reclone', { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-60"
      title="Reclone"
    >
      <FaRedo className="text-[11px]" />
      <span>{loading ? 'Recloning…' : 'Reclone'}</span>
    </button>
  );
}


