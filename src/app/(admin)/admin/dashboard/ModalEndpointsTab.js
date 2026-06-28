'use client';

import { useState, useEffect, useTransition } from 'react';
import { FaServer, FaPlus, FaTrash, FaUndo, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  getModalEndpoints,
  addModalEndpoint,
  resetModalEndpointCount,
  deleteModalEndpoint,
} from '../../../../lib/actions';

export default function ModalEndpointsTab() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [account, setAccount] = useState('');
  const [usageCount, setUsageCount] = useState(300);
  const [isPending, startTransition] = useTransition();

  const loadEndpoints = async () => {
    try {
      const data = await getModalEndpoints();
      setEndpoints(data);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
      toast.error('Failed to load Modal endpoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEndpoints();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!value) return;

    startTransition(async () => {
      try {
        await addModalEndpoint(value, account, usageCount);
        toast.success('Modal endpoint added successfully!');
        setValue('');
        setAccount('');
        setUsageCount(300);
        await loadEndpoints();
      } catch (error) {
        console.error('Failed to add endpoint:', error);
        toast.error('Failed to add endpoint');
      }
    });
  };

  const handleReset = async (id) => {
    if (!confirm('Are you sure you want to reset the usage count for this endpoint back to 300?')) return;
    
    startTransition(async () => {
      try {
        await resetModalEndpointCount(id, 300);
        toast.success('Usage count reset to 300!');
        await loadEndpoints();
      } catch (error) {
        console.error('Failed to reset count:', error);
        toast.error('Failed to reset usage count');
      }
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this Modal endpoint?')) return;

    startTransition(async () => {
      try {
        await deleteModalEndpoint(id);
        toast.success('Endpoint deleted successfully!');
        await loadEndpoints();
      } catch (error) {
        console.error('Failed to delete endpoint:', error);
        toast.error('Failed to delete endpoint');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-slate-900 border border-slate-700/60 rounded-2xl py-12">
        <FaSpinner className="text-indigo-400 text-3xl animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading Modal endpoints...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Endpoints */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <FaServer className="text-indigo-400" />
              <h2 className="text-[15px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                Active Modal Endpoints
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">{endpoints.length} endpoints</span>
          </div>

          <div className="divide-y divide-slate-800">
            {endpoints.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-500 text-sm">No Modal service endpoints configured.</p>
            ) : (
              endpoints.map((ep) => (
                <div key={ep.id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-slate-800/40 transition-colors">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-bold truncate block">{ep.value}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                        (ep.usage_count || 0) <= 0 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {(ep.usage_count || 0) <= 0 ? 'Limit Reached' : `${ep.usage_count} remaining`}
                      </span>
                    </div>
                    {ep.account && (
                      <p className="text-[11px] text-slate-400">Account: <span className="font-semibold">{ep.account}</span></p>
                    )}
                    <p className="text-[10px] text-slate-600">
                      Created: {new Date(ep.created_at).toLocaleString('en-GB')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReset(ep.id)}
                      disabled={isPending}
                      title="Reset usage count to 300"
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg transition-all disabled:opacity-50"
                    >
                      <FaUndo className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      disabled={isPending}
                      title="Delete endpoint"
                      className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all disabled:opacity-50"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Endpoint Form */}
      <div>
        <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              <FaPlus className="text-indigo-400 text-xs" />
              Add Modal Endpoint
            </h2>
            <p className="text-slate-500 text-xs">
              Register a new Modal execution worker for visual scene generation.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ep_value" className="text-xs font-semibold text-slate-400">
                Endpoint URL
              </label>
              <input
                id="ep_value"
                type="url"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                disabled={isPending}
                placeholder="https://longychima--flux-process.modal.run"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ep_account" className="text-xs font-semibold text-slate-400">
                Account Email / Identifier
              </label>
              <input
                id="ep_account"
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                disabled={isPending}
                placeholder="modal-user-identifier"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ep_count" className="text-xs font-semibold text-slate-400">
                Initial Usage Count Limit
              </label>
              <input
                id="ep_count"
                type="number"
                value={usageCount}
                onChange={(e) => setUsageCount(parseInt(e.target.value) || 300)}
                required
                min="0"
                disabled={isPending}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !value}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 active:translate-y-0 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50"
          >
            {isPending ? (
              <FaSpinner className="animate-spin text-xs" />
            ) : (
              <FaPlus className="text-[10px]" />
            )}
            {isPending ? 'Adding Endpoint...' : 'Add Endpoint'}
          </button>
        </form>
      </div>
    </div>
  );
}
