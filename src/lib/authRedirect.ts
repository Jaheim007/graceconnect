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
 * `/welcome-intent` is only used for brand-new accounts (step 4); it is never
 * forced on a returning sign-in.
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
      // Brand-new provider → onboarding; existing → home.
      const safe = safeReturnTo(intent.returnTo || null);
      return isNewUser ? (safe || '/create-org') : (safe || '/');
    }
    // Client intent: just return to what they were doing, otherwise home.
    return safeReturnTo(intent.returnTo || null) || '/';
  }

  // 4. No CTA, no pending action → the unified home (ActionHub).
  return '/';
}

