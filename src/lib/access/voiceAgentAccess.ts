/**
 * Voice Agent — private access allowlist (SINGLE SOURCE OF TRUTH, client side).
 *
 * Internal test feature. Nothing about it renders, routes, or connects for a
 * user whose UID is not listed here. To expand access, add a UID. To retire the
 * feature, empty the array (every entry point disappears automatically).
 *
 * The backend enforces the same list in
 * `supabase/functions/_shared/voice-agent-access.ts` — keep them in sync.
 */
export const VOICE_AGENT_ALLOWLIST: readonly string[] = [
  'aaa55147-6755-4733-a27a-1791b68e832e',
];

export const VOICE_AGENT_ROUTE = '/admin/voice-agent';

export function canUseVoiceAgent(userId?: string | null): boolean {
  return !!userId && VOICE_AGENT_ALLOWLIST.includes(userId);
}
