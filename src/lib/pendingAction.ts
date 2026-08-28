/**
 * Pending action — a customer/provider action interrupted by auth.
 *
 * Priority after login: resume this action → last-used workspace → account home.
 * Stored in sessionStorage (dies with the tab if abandoned). Do NOT store
 * sensitive data (card, MoMo secret, password). Only enough to bring the user
 * back to the exact composer/checkout/booking step.
 */

export type PendingActionType =
  | 'buy_product'
  | 'message_provider'
  | 'book_service'
  | 'request_quote'
  | 'buy_ticket'
  | 'donate'
  | 'save_item'
  | 'offer_services'
  | 'create_organization'
  | 'resume_course'
  | 'generic';

export interface PendingAction {
  type: PendingActionType;
  returnTo: string;
  /** Non-sensitive UI state (ids, selected slot, draft snippet). Never card/MoMo secrets. */
  state?: Record<string, unknown>;
  ts: number;
}

const KEY = 'sv_pending_action';
const LEGACY_RETURN_TO = 'sv_auth_returnTo';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 min

/** Only allow same-origin, root-relative paths. Blocks open redirects. */
export function safeReturnTo(candidate: string | null | undefined): string | null {
  if (!candidate || typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  // Must start with a single '/' and not '//' (protocol-relative) or '/\'.
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null;
  // Reject auth/callback loops.
  if (trimmed.startsWith('/auth')) return null;
  return trimmed;
}

export function setPendingAction(
  type: PendingActionType,
  returnTo: string,
  state?: Record<string, unknown>,
) {
  const safe = safeReturnTo(returnTo);
  if (!safe) return;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ type, returnTo: safe, state, ts: Date.now() } as PendingAction),
    );
    // Backward-compat mirror for legacy code paths that only read sv_auth_returnTo.
    sessionStorage.setItem(LEGACY_RETURN_TO, safe);
  } catch {}
}

/**
 * @param typedOnly when true, ignore the legacy plain `sv_auth_returnTo` mirror.
 *   Surfaces like /dashboard must not be hijacked by a stale legacy value.
 */
export function peekPendingAction(typedOnly = false): PendingAction | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PendingAction;
      if (parsed?.returnTo && Date.now() - (parsed.ts ?? 0) < MAX_AGE_MS) {
        const safe = safeReturnTo(parsed.returnTo);
        if (safe) return { ...parsed, returnTo: safe };
      }
      sessionStorage.removeItem(KEY);
    }
    // Fall back to legacy plain returnTo string.
    if (typedOnly) return null;
    const legacy = sessionStorage.getItem(LEGACY_RETURN_TO);
    const safeLegacy = safeReturnTo(legacy);
    if (safeLegacy) {
      return { type: 'generic', returnTo: safeLegacy, ts: Date.now() };
    }
  } catch {}
  return null;
}

export function consumePendingAction(typedOnly = false): PendingAction | null {
  const p = peekPendingAction(typedOnly);
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_RETURN_TO);
  } catch {}
  return p;
}

export function clearPendingAction() {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_RETURN_TO);
  } catch {}
}
