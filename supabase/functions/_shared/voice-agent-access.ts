/**
 * Voice Agent — private access allowlist (SINGLE SOURCE OF TRUTH, server side).
 * Mirror of `src/lib/access/voiceAgentAccess.ts`.
 */
export const VOICE_AGENT_ALLOWLIST: readonly string[] = [
  'aaa55147-6755-4733-a27a-1791b68e832e',
];

export function canUseVoiceAgent(userId?: string | null): boolean {
  return !!userId && VOICE_AGENT_ALLOWLIST.includes(userId);
}
