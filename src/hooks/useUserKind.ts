import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';

export type UserKind = 'provider' | 'buyer' | 'new';

/**
 * Classifies the current user for intent-first routing.
 * - provider: has ≥1 managed org (implicitly covers products/sales/wallet/KYC/payout/affiliate/public page)
 * - buyer:    no provider signals, but has purchases
 * - new:      neither
 */
export function useUserKind(): { kind: UserKind; isLoading: boolean } {
  const { user } = useAuth();
  const { userOrgs, canManage, isLoadingOrgs } = useOrg();

  const isProvider = userOrgs.some((o) => canManage(o.id));

  const { data: hasPurchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['user-kind-has-purchases', user?.id],
    enabled: !!user && !isProvider && !isLoadingOrgs,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user) return false;
      const { count } = await db
        .from('product_purchases')
        .select('id', { head: true, count: 'exact' })
        .eq('buyer_id', user.id);
      return (count ?? 0) > 0;
    },
  });

  if (!user) return { kind: 'new', isLoading: false };
  if (isLoadingOrgs) return { kind: 'new', isLoading: true };
  if (isProvider) return { kind: 'provider', isLoading: false };
  if (purchasesLoading) return { kind: 'new', isLoading: true };
  return { kind: hasPurchases ? 'buyer' : 'new', isLoading: false };
}
