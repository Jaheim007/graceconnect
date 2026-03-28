import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { supabase } from '@/integrations/supabase/client';
import type { OrgCategory } from '@/types/database';

/**
 * Detected user profile types for adaptive UI.
 *
 * - buyer        : has no org, no affiliate links — just buys/consumes content
 * - ambassador   : has affiliate links but no managed org
 * - creator      : has a managed org (standard category)
 * - org-religious: has a managed org with category church/ministry/ngo/community
 */
export type UserProfileType = 'buyer' | 'ambassador' | 'creator' | 'org-religious';

const RELIGIOUS_CATEGORIES: OrgCategory[] = ['church', 'ministry', 'ngo', 'community'];

export interface UserProfileResult {
  /** Detected profile — defaults to 'buyer' while loading */
  profile: UserProfileType;
  isLoading: boolean;
  /** User has at least one completed purchase */
  hasPurchases: boolean;
  /** User manages at least one organization */
  hasOrgs: boolean;
  /** User has at least one affiliate link */
  hasAffiliateLinks: boolean;
  /** Current org is a religious/NGO org */
  isReligiousOrg: boolean;
  /** Number of completed purchases */
  purchaseCount: number;
}

export function useUserProfile(): UserProfileResult {
  const { user } = useAuth();
  const { userOrgs, currentOrg, canManage, isLoadingOrgs } = useOrg();

  // Check if user has affiliate links
  const { data: affiliateLinkCount = 0, isLoading: loadingLinks } = useQuery({
    queryKey: ['user-affiliate-link-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('affiliate_links')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  // Check if user has purchases
  const { data: purchaseCount = 0, isLoading: loadingPurchases } = useQuery({
    queryKey: ['user-purchase-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('product_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const isLoading = isLoadingOrgs || loadingLinks || loadingPurchases;
  const hasManagedOrgs = userOrgs.some((org) => canManage(org.id));
  const hasAffiliateLinks = affiliateLinkCount > 0;
  const hasPurchases = purchaseCount > 0;

  const currentCategory = currentOrg?.category as OrgCategory | undefined;
  const isReligiousOrg = !!currentCategory && RELIGIOUS_CATEGORIES.includes(currentCategory);

  const profile = useMemo<UserProfileType>(() => {
    if (hasManagedOrgs) {
      return isReligiousOrg ? 'org-religious' : 'creator';
    }
    if (hasAffiliateLinks) {
      return 'ambassador';
    }
    return 'buyer';
  }, [hasManagedOrgs, isReligiousOrg, hasAffiliateLinks]);

  return {
    profile,
    isLoading,
    hasPurchases,
    hasOrgs: hasManagedOrgs,
    hasAffiliateLinks,
    isReligiousOrg,
    purchaseCount,
  };
}
