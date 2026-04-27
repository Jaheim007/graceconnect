/**
 * useBillingUsage — Sprint 9
 *
 * Fetches the current user's monthly consumption stats (AI credits used,
 * products sold, net revenue, commission saved, etc.) via the
 * `get_billing_usage_stats` RPC.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BillingUsageStats {
  ai_credits_used_month: number;
  products_sold_month: number;
  revenue_net_month: number;
  commission_saved_month: number;
  active_products: number;
  total_organizations: number;
}

export function useBillingUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['billing-usage', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<BillingUsageStats | null> => {
      if (!user?.id) return null;
      const { data, error } = await (supabase as any).rpc('get_billing_usage_stats', {
        _user_id: user.id,
      });
      if (error) {
        console.warn('[useBillingUsage] rpc error', error);
        return null;
      }
      const row = Array.isArray(data) ? data[0] : data;
      return row as BillingUsageStats;
    },
  });
}
