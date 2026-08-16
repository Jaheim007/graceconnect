import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';

export interface CreatorSalesEarnings {
  isLoading: boolean;
  /** net amount the creator keeps on completed sales (after fees/commissions) */
  netAmount: number;
  /** gross amount paid by buyers on completed sales */
  grossAmount: number;
  /** net amount on donations received */
  donationsAmount: number;
  salesCount: number;
  donationsCount: number;
  currency: string;
}

/**
 * Sales earnings across every workspace the user manages — the "creator" side
 * of the money story, mirroring the ambassador earnings roll-up so the home
 * screen can show both without opening the Revenue page.
 */
export function useCreatorSalesEarnings(): CreatorSalesEarnings {
  const { userOrgs, currentOrg, canManage } = useOrg();

  const orgIds = useMemo(
    () => userOrgs.filter((o) => canManage(o.id)).map((o) => o.id),
    [userOrgs, canManage],
  );

  const currency = currentOrg?.currency || userOrgs[0]?.currency || 'XOF';

  const { data, isLoading } = useQuery({
    queryKey: ['creator-sales-earnings', orgIds.join(',')],
    enabled: orgIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const [purchases, donations] = await Promise.all([
        db
          .from('product_purchases')
          .select('amount, organization_amount, status')
          .in('organization_id', orgIds)
          .eq('status', 'completed')
          .limit(1000),
        db
          .from('donations')
          .select('amount, organization_amount, status')
          .in('organization_id', orgIds)
          .eq('status', 'completed')
          .limit(1000),
      ]);

      const pRows = (purchases.data || []) as any[];
      const dRows = (donations.data || []) as any[];

      return {
        netAmount: pRows.reduce(
          (s, r) => s + Number(r.organization_amount ?? r.amount ?? 0),
          0,
        ),
        grossAmount: pRows.reduce((s, r) => s + Number(r.amount || 0), 0),
        salesCount: pRows.length,
        donationsAmount: dRows.reduce(
          (s, r) => s + Number(r.organization_amount ?? r.amount ?? 0),
          0,
        ),
        donationsCount: dRows.length,
      };
    },
  });

  return {
    isLoading: orgIds.length > 0 && isLoading,
    netAmount: data?.netAmount ?? 0,
    grossAmount: data?.grossAmount ?? 0,
    donationsAmount: data?.donationsAmount ?? 0,
    salesCount: data?.salesCount ?? 0,
    donationsCount: data?.donationsCount ?? 0,
    currency,
  };
}
