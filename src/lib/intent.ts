/**
 * Persisted user intent — survives auth redirects.
 * Set from the homepage two-card chooser, or from a "Sign up to continue" CTA.
 */
export type IntentKind = 'client' | 'provider';

export interface StoredIntent {
  kind: IntentKind;
  returnTo?: string;
  ts: number;
}

const KEY = 'sv_intent';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 min

export function setIntent(kind: IntentKind, returnTo?: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ kind, returnTo, ts: Date.now() } as StoredIntent));
  } catch {}
}

export function getIntent(): StoredIntent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredIntent;
    if (!parsed?.kind) return null;
    if (Date.now() - (parsed.ts ?? 0) > MAX_AGE_MS) {
      clearIntent();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearIntent() {
  try { localStorage.removeItem(KEY); } catch {}
}
