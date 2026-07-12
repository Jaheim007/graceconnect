import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import type { Organization } from '@/types/database';

export type CurrentSpace =
  | { kind: 'personal'; id: 'personal'; label: string; avatarUrl?: string | null; subtitle?: string | null }
  | { kind: 'org'; id: string; label: string; avatarUrl?: string | null; subtitle?: string | null; org: Organization };

/**
 * Thin adapter over AuthContext + OrgContext that reports the "current space":
 * either the user's Personal context (currentOrg === null) or the selected org.
 * No state — pure derivation. Introduced in Step 1 of the SiteViral workspace model.
 */
export function useCurrentSpace(): CurrentSpace | null {
  const { user, profile } = useAuth();
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (!user) return null;

  if (currentOrg) {
    return {
      kind: 'org',
      id: currentOrg.id,
      label: currentOrg.name,
      avatarUrl: currentOrg.logo_url ?? null,
      subtitle: null,
      org: currentOrg,
    };
  }

  const displayName =
    (profile as any)?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    (isFr ? 'Personnel' : 'Personal');

  return {
    kind: 'personal',
    id: 'personal',
    label: isFr ? 'Personnel' : 'Personal',
    avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
    subtitle: displayName,
  };
}

export const PERSONAL_SPACE_KEY = '__personal__';
