import { supabase } from './supabase.js';
import { configure } from '@trigger.dev/sdk/v3';

// ── Cache ─────────────────────────────────────────────────────────────────────
let _cachedKey = null;
let _cacheTs   = 0;
const CACHE_TTL = 30_000;

/**
 * Reads the active deployment from `trigger_deployments` and returns the correct
 * secret key based on the admin-controlled `active_mode` column:
 *   active_mode = 'prod'  → prod_secret_key  (tr_prod_...)
 *   active_mode = 'dev'   → dev_secret_key   (tr_dev_...)
 *
 * Falls back to TRIGGER_SECRET_KEY env var if no active deployment row exists.
 */
export async function getTriggerSecretKey() {
  const now = Date.now();
  if (_cachedKey && now - _cacheTs < CACHE_TTL) return _cachedKey;

  const { data, error } = await supabase
    .from('trigger_deployments')
    .select('dev_secret_key, prod_secret_key, active_mode, name')
    .eq('is_active', true)
    .maybeSingle();

  if (!error && data) {
    const mode   = data.active_mode ?? 'dev';
    const keyCol = mode === 'prod' ? 'prod_secret_key' : 'dev_secret_key';
    const key    = data[keyCol];

    if (key) {
      _cachedKey = key;
      _cacheTs   = now;
      console.log(`[triggerConfig] "${data.name}" — using ${mode} key (${keyCol})`);
      return _cachedKey;
    }

    console.warn(
      `[triggerConfig] Active deployment "${data.name}" has active_mode="${mode}" ` +
      `but ${keyCol} is empty. Falling back to env var.`
    );
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  const envKey = process.env.TRIGGER_SECRET_KEY;
  if (envKey) {
    console.warn('[triggerConfig] No active deployment found — using TRIGGER_SECRET_KEY env var.');
    return envKey;
  }

  throw new Error(
    'Trigger.dev not configured: no active deployment in trigger_deployments and TRIGGER_SECRET_KEY env var is missing.'
  );
}

/**
 * Fetches the correct key and calls configure(). Use at the top of every route handler.
 */
export async function configureTrigger() {
  const secretKey = await getTriggerSecretKey();
  configure({ secretKey });
}

/** Call after activating, editing, or switching mode to force a fresh DB lookup. */
export function invalidateTriggerCache() {
  _cachedKey = null;
  _cacheTs   = 0;
}
