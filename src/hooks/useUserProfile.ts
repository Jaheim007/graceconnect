import { useMemo } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useUserCapabilities } from '@/hooks/useUserCapabilities';
import type { OrgCategory } from '@/types/database';

/**
 * Legacy façade over {@link useUserCapabilities}.
 *
 * Capabilities are cumulative: a user can be buyer + ambassador + creator at
 * once. `profile` is kept only for surfaces that still need a single label —
 * prefer `useUserCapabilities()` for anything new.
 */
export type UserProfileType = 'buyer' | 'ambassador' | 'creator' | 'org-religious';

const RELIGIOUS_CATEGORIES: OrgCategory[] = ['church', 'ministry', 'ngo', 'community'];

export interface UserProfileResult {
  profile: UserProfileType;
  isLoading: boolean;
  hasPurchases: boolean;
  hasOrgs: boolean;
  hasAffiliateLinks: boolean;
  isReligiousOrg: boolean;
  purchaseCount: number;
}

export function useUserProfile(): UserProfileResult {
  const { currentOrg } = useOrg();
  const caps = useUserCapabilities();

  const currentCategory = currentOrg?.category as OrgCategory | undefined;
  const isReligiousOrg = !!currentCategory && RELIGIOUS_CATEGORIES.includes(currentCategory);

  const profile = useMemo<UserProfileType>(() => {
    if (caps.canCreate) return isReligiousOrg ? 'org-religious' : 'creator';
    if (caps.canEarn) return 'ambassador';
    return 'buyer';
  }, [caps.canCreate, caps.canEarn, isReligiousOrg]);

  return {
    profile,
    isLoading: caps.isLoading,
    hasPurchases: caps.library.purchaseCount > 0 || caps.library.pdfCount > 0,
    hasOrgs: caps.canCreate,
    hasAffiliateLinks: caps.canEarn,
    isReligiousOrg,
    purchaseCount: caps.library.purchaseCount,
  };
}
