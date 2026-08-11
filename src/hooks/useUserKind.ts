import { useUserCapabilities } from '@/hooks/useUserCapabilities';

export type UserKind = 'provider' | 'buyer' | 'new';

/**
 * Legacy façade over {@link useUserCapabilities}.
 *
 * Roles are NOT exclusive in SiteViral — this collapses cumulative capabilities
 * into a single label for older routing code only. Prefer
 * `useUserCapabilities()` for new surfaces.
 */
export function useUserKind(): { kind: UserKind; isLoading: boolean } {
  const caps = useUserCapabilities();

  if (caps.isLoading) return { kind: 'new', isLoading: true };
  if (caps.canCreate) return { kind: 'provider', isLoading: false };
  if (caps.canLearn) return { kind: 'buyer', isLoading: false };
  return { kind: 'new', isLoading: false };
}
