import { consumePendingAction, safeReturnTo } from '@/lib/pendingAction';
import { getIntent, clearIntent } from '@/lib/intent';

/**
 * Decide where to send a freshly-authenticated user.
 *
 * Priority (Step-3 sign-in decision flow):
 *   1. Pending customer/provider action (validated returnTo)
 *   2. Explicit ?returnTo query param (validated)
 *   3. Explicit stored intent (provider / client) from a CTA
 *   4. Last-used workspace via sv_current_org_id → root org hydration restores it
 *   5. Unified account home for true zero-workspace users
 *
 * `/welcome-intent` is NEVER forced for a normal sign-in; it stays reachable
 * as an opt-in chooser only.
 */
export function resolvePostAuthRedirect(opts: {
  isNewUser: boolean;
  explicitReturnTo?: string | null;
}): string {
  const { isNewUser, explicitReturnTo } = opts;

  // 1. Pending action (Buy, Message, Book, Donate, Offer services, …)
  const pending = consumePendingAction();
  if (pending?.returnTo) {
    // side-effect: intent already consumed if compatible
    clearIntent();
    return pending.returnTo;
  }

  // 2. Explicit ?returnTo on the /auth URL
  const safeExplicit = safeReturnTo(explicitReturnTo ?? null);
  if (safeExplicit) {
    clearIntent();
    return safeExplicit;
  }

  // 3. Provider/client intent from a CTA click
  const intent = getIntent();
  if (intent) {
    clearIntent();
    if (intent.kind === 'provider') {
      // Brand-new provider → onboarding; existing → their dashboard.
      const safe = safeReturnTo(intent.returnTo || null);
      return isNewUser ? (safe || '/start') : (safe || '/dashboard');
    }
    // Client intent: just return to what they were doing, otherwise account home.
    return safeReturnTo(intent.returnTo || null) || '/dashboard';
  }

  // 4 + 5. Account home OR last-used workspace — OrgContext restores globally
  // before signed-in shells render, and /dashboard resolves to /admin when ready.
  return '/dashboard';
}
