import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { getAdminCookie } from '../../../../lib/adminAuth';
import { invalidateTriggerCache } from '../../../../lib/triggerConfig';

async function requireAdmin() {
  const ok = await getAdminCookie();
  if (!ok) throw new Error('UNAUTHORIZED');
}

function maskKey(key) {
  if (!key) return null;
  return `${key.slice(0, 10)}••••`;
}

function sanitize(d) {
  return {
    ...d,
    dev_secret_key_hint:  maskKey(d.dev_secret_key),
    prod_secret_key_hint: maskKey(d.prod_secret_key),
    dev_secret_key:  undefined,
    prod_secret_key: undefined,
  };
}

// ── GET — list all ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabase
      .from('trigger_deployments')
      .select('id, name, project_id, is_active, active_mode, description, created_at, updated_at, dev_secret_key, prod_secret_key')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ deployments: (data ?? []).map(sanitize) });
  } catch (err) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — create ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    await requireAdmin();
    const { name, project_id, dev_secret_key, prod_secret_key, description } = await request.json();
    if (!name || (!dev_secret_key && !prod_secret_key))
      return NextResponse.json({ error: 'name and at least one secret key are required.' }, { status: 400 });

    const { data, error } = await supabase
      .from('trigger_deployments')
      .insert({ name, project_id: project_id || null, dev_secret_key: dev_secret_key || null, prod_secret_key: prod_secret_key || null, description: description || null, is_active: false, active_mode: 'dev' })
      .select('id, name, project_id, is_active, active_mode, description, created_at, dev_secret_key, prod_secret_key')
      .single();
    if (error) throw error;
    return NextResponse.json({ deployment: sanitize(data) }, { status: 201 });
  } catch (err) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH — activate OR switch mode ──────────────────────────────────────────
// Body: { id }              → activate that deployment
// Body: { id, mode }        → switch active_mode ('dev' | 'prod') without changing is_active
export async function PATCH(request) {
  try {
    await requireAdmin();
    const { id, mode } = await request.json();
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

    // ── Mode switch only ──────────────────────────────────────────────────
    if (mode) {
      if (!['dev', 'prod'].includes(mode))
        return NextResponse.json({ error: 'mode must be "dev" or "prod".' }, { status: 400 });

      const { data, error } = await supabase
        .from('trigger_deployments')
        .update({ active_mode: mode, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, name, active_mode, is_active')
        .single();
      if (error) throw error;
      invalidateTriggerCache();
      return NextResponse.json({ deployment: data });
    }

    // ── Activation ────────────────────────────────────────────────────────
    await supabase.from('trigger_deployments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .neq('id', id);

    const { data, error } = await supabase
      .from('trigger_deployments')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, is_active, active_mode')
      .single();
    if (error) throw error;
    invalidateTriggerCache();
    return NextResponse.json({ deployment: data });
  } catch (err) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT — edit keys / name / description ─────────────────────────────────────
export async function PUT(request) {
  try {
    await requireAdmin();
    const { id, name, project_id, dev_secret_key, prod_secret_key, description } = await request.json();
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

    const updates = { updated_at: new Date().toISOString() };
    if (name        !== undefined) updates.name        = name;
    if (project_id  !== undefined) updates.project_id  = project_id  || null;
    if (description !== undefined) updates.description = description  || null;
    // Only overwrite a key if a non-empty value was provided (empty string = keep existing)
    if (dev_secret_key  && dev_secret_key.trim())  updates.dev_secret_key  = dev_secret_key.trim();
    if (prod_secret_key && prod_secret_key.trim()) updates.prod_secret_key = prod_secret_key.trim();

    const { data, error } = await supabase
      .from('trigger_deployments')
      .update(updates)
      .eq('id', id)
      .select('id, name, project_id, is_active, active_mode, description, created_at, updated_at, dev_secret_key, prod_secret_key')
      .single();
    if (error) throw error;
    invalidateTriggerCache();
    return NextResponse.json({ deployment: sanitize(data) });
  } catch (err) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('PUT trigger-deployment:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id query param is required.' }, { status: 400 });
    const { error } = await supabase.from('trigger_deployments').delete().eq('id', id);
    if (error) throw error;
    invalidateTriggerCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
