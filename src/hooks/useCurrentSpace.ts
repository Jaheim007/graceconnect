import { useOrg } from '@/contexts/OrgContext';
import type { Organization } from '@/types/database';

export type CurrentSpace =
  | { kind: 'org'; id: string; label: string; avatarUrl?: string | null; subtitle?: string | null; org: Organization }
  | null;

/**
 * Thin adapter reporting the currently managed workspace, or `null` when the
 * user isn't managing any org (the account-wide customer context).
 *
 * The old "Personal" branch was removed — the app no longer treats Personal
 * as a peer workspace. For identity/profile display, read `useAuth()` directly.
 */
export function useCurrentSpace(): CurrentSpace {
  const { currentOrg } = useOrg();
  if (!currentOrg) return null;
  return {
    kind: 'org',
    id: currentOrg.id,
    label: currentOrg.name,
    avatarUrl: currentOrg.logo_url ?? null,
    subtitle: null,
    org: currentOrg,
  };
}
