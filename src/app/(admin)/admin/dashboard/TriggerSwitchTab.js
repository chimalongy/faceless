'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FaBolt, FaSpinner, FaPlus, FaTrash, FaCheckCircle,
  FaExclamationTriangle, FaEye, FaEyeSlash, FaServer,
  FaPencilAlt, FaTimes, FaSave, FaCode,
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import toast from 'react-hot-toast';

// ── Masked key input with show/hide toggle ─────────────────────────────────────
function KeyInput({ name, label, placeholder, value, onChange, accent = 'blue' }) {
  const [show, setShow] = useState(false);
  const ring = accent === 'green'
    ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
    : 'focus:border-blue-500 focus:ring-blue-500/20';
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          name={name} type={show ? 'text' : 'password'} placeholder={placeholder}
          value={value} onChange={onChange}
          className={`w-full px-3 py-2 pr-9 rounded-xl bg-slate-800 border border-slate-700 text-[13px] text-white placeholder-slate-500 font-mono outline-none focus:ring-2 transition-all ${ring}`}
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
          {show ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
        </button>
      </div>
    </div>
  );
}

// ── Dev / Prod mode toggle pill ────────────────────────────────────────────────
function ModeToggle({ mode, onChange, loading }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
      <button
        onClick={() => onChange('dev')} disabled={loading}
        className={`px-3 py-1 text-[11px] font-bold tracking-wide transition-all ${
          mode === 'dev'
            ? 'bg-blue-500/20 text-blue-300 border-r border-blue-500/30'
            : 'bg-slate-800 text-slate-500 hover:text-slate-300 border-r border-slate-700'
        }`}
      >
        {loading === 'dev' ? <FaSpinner className="animate-spin inline" /> : 'DEV'}
      </button>
      <button
        onClick={() => onChange('prod')} disabled={loading}
        className={`px-3 py-1 text-[11px] font-bold tracking-wide transition-all ${
          mode === 'prod'
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-slate-800 text-slate-500 hover:text-slate-300'
        }`}
      >
        {loading === 'prod' ? <FaSpinner className="animate-spin inline" /> : 'PROD'}
      </button>
    </div>
  );
}

// ── Inline Edit Form ───────────────────────────────────────────────────────────
function EditForm({ dep, onSave, onCancel }) {
  const [form, setForm]       = useState({
    name:            dep.name        ?? '',
    project_id:      dep.project_id  ?? '',
    dev_secret_key:  '',
    prod_secret_key: '',
    description:     dep.description ?? '',
  });
  const [loading, setLoading] = useState(false);
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/trigger-deployment', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: dep.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Deployment updated');
      onSave(data.deployment);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-slate-700/60 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Display Name *</label>
          <input name="name" value={form.name} onChange={handle} required
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[13px] text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project ID</label>
          <input name="project_id" value={form.project_id} onChange={handle} placeholder="proj_..."
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[13px] text-white font-mono placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KeyInput name="dev_secret_key" label="Dev Key (leave blank to keep existing)" placeholder="tr_dev_••••••••" value={form.dev_secret_key} onChange={handle} accent="blue" />
        <KeyInput name="prod_secret_key" label="Prod Key (leave blank to keep existing)" placeholder="tr_prod_•••••••" value={form.prod_secret_key} onChange={handle} accent="green" />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
        <input name="description" value={form.description} onChange={handle} placeholder="Short description"
          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[13px] text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold transition-all disabled:opacity-60">
          {loading ? <FaSpinner className="animate-spin text-[10px]" /> : <FaSave className="text-[10px]" />}
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-[12px] font-semibold transition-all">
          <FaTimes className="text-[10px]" /> Cancel
        </button>
      </div>
    </form>
  );
}

// ── Deployment Card ────────────────────────────────────────────────────────────
function DeploymentCard({ dep, onActivate, onDelete, onUpdate, activating, deleting }) {
  const [editing, setEditing]       = useState(false);
  const [modeLoading, setModeLoading] = useState(null);
  const isActive = dep.is_active;

  const handleModeSwitch = async (newMode) => {
    if (newMode === dep.active_mode) return;
    setModeLoading(newMode);
    try {
      const res  = await fetch('/api/admin/trigger-deployment', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: dep.id, mode: newMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate({ ...dep, active_mode: data.deployment.active_mode });
      toast.success(`Switched to ${newMode.toUpperCase()} key`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setModeLoading(null);
    }
  };

  const handleSaveEdit = (updated) => {
    onUpdate(updated);
    setEditing(false);
  };

  return (
    <div className={`relative rounded-2xl border p-5 transition-all ${
      isActive
        ? 'bg-indigo-500/5 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
        : 'bg-slate-900 border-slate-700/60 hover:border-slate-600'
    }`}>
      {isActive && <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/30 pointer-events-none" />}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isActive
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25'
            : 'bg-slate-800 border border-slate-700'
        }`}>
          <FaServer className={`text-sm ${isActive ? 'text-white' : 'text-slate-500'}`} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p className="text-[15px] font-bold text-white">{dep.name}</p>
            {isActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300">
                <FaCheckCircle className="text-[9px]" /> Active
              </span>
            )}
          </div>

          {/* Project ID */}
          {dep.project_id && (
            <div className="flex items-center gap-1.5 mb-2">
              <FaCode className="text-slate-600 text-[10px]" />
              <span className="text-[11px] text-slate-500 font-mono">{dep.project_id}</span>
            </div>
          )}

          {/* Key hints */}
          <div className="flex flex-wrap gap-2 mb-2.5">
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono ${dep.dev_secret_key_hint ? 'bg-blue-500/8 border-blue-500/20 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
              dev: {dep.dev_secret_key_hint ?? 'not set'}
            </span>
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono ${dep.prod_secret_key_hint ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
              prod: {dep.prod_secret_key_hint ?? 'not set'}
            </span>
          </div>

          {/* Mode toggle — show for all cards */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-slate-500">Using:</span>
            <ModeToggle mode={dep.active_mode ?? 'dev'} onChange={handleModeSwitch} loading={modeLoading} />
            {isActive && (
              <span className="text-[10px] text-slate-600">
                (routes use {dep.active_mode === 'prod' ? 'prod' : 'dev'} key)
              </span>
            )}
          </div>

          {dep.description && <p className="text-[11px] text-slate-500 mt-1.5">{dep.description}</p>}
          <p className="text-[10px] text-slate-600 mt-1">
            Added {new Date(dep.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>

          {/* Inline edit form */}
          {editing && (
            <EditForm dep={dep} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isActive && (
            <button onClick={() => onActivate(dep.id)} disabled={!!activating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold transition-all disabled:opacity-60 shadow-md shadow-indigo-500/20">
              {activating === dep.id ? <FaSpinner className="animate-spin text-[10px]" /> : <FaBolt className="text-[10px]" />}
              {activating === dep.id ? '…' : 'Activate'}
            </button>
          )}
          <button onClick={() => setEditing(!editing)} title="Edit"
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all text-[11px] ${editing ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            <FaPencilAlt />
          </button>
          <button onClick={() => onDelete(dep.id, dep.name)}
            disabled={deleting === dep.id || isActive}
            title={isActive ? 'Deactivate first' : 'Delete'}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[11px]">
            {deleting === dep.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Deployment Form ────────────────────────────────────────────────────────
function AddDeploymentForm({ onAdd }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: '', project_id: '', dev_secret_key: '', prod_secret_key: '', description: '' });
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.dev_secret_key.trim() && !form.prod_secret_key.trim()) { toast.error('At least one secret key is required'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/trigger-deployment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`"${form.name}" added`);
      onAdd(data.deployment);
      setForm({ name: '', project_id: '', dev_secret_key: '', prod_secret_key: '', description: '' });
      setOpen(false);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 text-[13px] font-semibold transition-all">
      <FaPlus className="text-xs" /> Add Trigger.dev Deployment
    </button>
  );

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6">
      <h3 className="text-[15px] font-bold text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>New Deployment</h3>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Display Name *</label>
            <input name="name" value={form.name} onChange={handle} required placeholder="e.g. FacelessStudio Main"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[13px] text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project ID <span className="normal-case text-slate-600">(optional)</span></label>
            <input name="project_id" value={form.project_id} onChange={handle} placeholder="proj_ocrnikuwoeibypadxobk"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[13px] text-white font-mono placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KeyInput name="dev_secret_key"  label="Dev Secret Key"  placeholder="tr_dev_••••••••••••••••"  value={form.dev_secret_key}  onChange={handle} accent="blue" />
          <KeyInput name="prod_secret_key" label="Prod Secret Key" placeholder="tr_prod_•••••••••••••••" value={form.prod_secret_key} onChange={handle} accent="green" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes <span className="normal-case text-slate-600">(optional)</span></label>
          <input name="description" value={form.description} onChange={handle} placeholder="Short description"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[13px] text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <HiSparkles className="text-indigo-400 text-xs mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            After adding, use the <strong className="text-slate-300">DEV / PROD</strong> toggle on the card to control which key is active. 
            Keys are masked in the UI and never exposed to the browser in full.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white text-[13px] font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-60">
            {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaPlus className="text-xs" />}
            {loading ? 'Saving…' : 'Add Deployment'}
          </button>
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-[13px] font-semibold transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────
export default function TriggerSwitchTab() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activating, setActivating]   = useState(null);
  const [deleting, setDeleting]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch('/api/admin/trigger-deployment');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setDeployments(data.deployments);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (id) => {
    setActivating(id);
    try {
      const res  = await fetch('/api/admin/trigger-deployment', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeployments((prev) => prev.map((d) => ({ ...d, is_active: d.id === id })));
      toast.success(`"${data.deployment.name}" is now active`);
    } catch (err) { toast.error(err.message); }
    finally { setActivating(null); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    try {
      const res  = await fetch(`/api/admin/trigger-deployment?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeployments((prev) => prev.filter((d) => d.id !== id));
      toast.success(`"${name}" deleted`);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(null); }
  };

  const handleUpdate  = (updated) => setDeployments((prev) => prev.map((d) => d.id === updated.id ? { ...d, ...updated } : d));
  const handleAdd     = (dep)     => setDeployments((prev) => [dep, ...prev]);
  const active        = deployments.find((d) => d.is_active);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <FaSpinner className="animate-spin text-indigo-400 text-2xl" />
      <p className="text-slate-500 text-sm">Loading deployments…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <FaExclamationTriangle className="text-amber-400 text-2xl" />
      <p className="text-amber-400 font-semibold">{error}</p>
      <button onClick={load} className="mt-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-[13px] font-semibold text-white">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Status banner */}
      {active ? (
        <div className="flex items-start gap-3 px-5 py-3.5 rounded-2xl bg-indigo-500/8 border border-indigo-500/20">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-indigo-300">
              Active: <span className="text-white">{active.name}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${active.active_mode === 'prod' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blue-500/15 text-blue-300'}`}>
                {(active.active_mode ?? 'dev').toUpperCase()} KEY
              </span>
            </p>
            <p className="text-[11px] text-indigo-400/70 mt-0.5">
              All trigger.tasks() calls use the <strong>{active.active_mode ?? 'dev'}</strong> secret key. 
              Use the DEV / PROD toggle on the card to switch. Cache refreshes every 30 s.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/8 border border-amber-500/20">
          <FaExclamationTriangle className="text-amber-400 flex-shrink-0" />
          <p className="text-[13px] text-amber-300">
            No active deployment — falling back to <code className="text-amber-200">TRIGGER_SECRET_KEY</code> env var.
          </p>
        </div>
      )}

      {/* Deployment cards */}
      {deployments.length === 0 ? (
        <p className="text-center py-12 text-slate-500 text-sm">No deployments yet. Add one below.</p>
      ) : (
        <div className="space-y-3">
          {deployments.map((dep) => (
            <DeploymentCard
              key={dep.id}
              dep={dep}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              activating={activating}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      <AddDeploymentForm onAdd={handleAdd} />

      {/* Migration SQL */}
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <HiSparkles className="text-indigo-400 text-sm" />
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Supabase Migration</p>
        </div>
        <pre className="text-[11px] text-slate-400 font-mono leading-relaxed overflow-x-auto whitespace-pre">{`-- Fresh install:
CREATE TABLE IF NOT EXISTS trigger_deployments (
  id              BIGSERIAL    PRIMARY KEY,
  name            TEXT         NOT NULL,
  project_id      TEXT,
  dev_secret_key  TEXT,
  prod_secret_key TEXT,
  active_mode     TEXT         NOT NULL DEFAULT 'dev'
                    CHECK (active_mode IN ('dev', 'prod')),
  is_active       BOOLEAN      NOT NULL DEFAULT FALSE,
  description     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS trigger_deployments_single_active
  ON trigger_deployments (is_active) WHERE is_active = TRUE;

-- Upgrading from old schema:
ALTER TABLE trigger_deployments
  ADD COLUMN IF NOT EXISTS dev_secret_key  TEXT,
  ADD COLUMN IF NOT EXISTS prod_secret_key TEXT,
  ADD COLUMN IF NOT EXISTS project_id      TEXT,
  ADD COLUMN IF NOT EXISTS active_mode     TEXT NOT NULL DEFAULT 'dev'
    CHECK (active_mode IN ('dev', 'prod'));`}</pre>
      </div>
    </div>
  );
}
