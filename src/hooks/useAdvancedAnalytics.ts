import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BuyerCohort {
  cohort_month: string;
  buyers_count: number;
  m1_retained: number;
  m2_retained: number;
  m3_retained: number;
  m6_retained: number;
}

export interface ChurnMetrics {
  total_buyers: number;
  active_buyers: number;
  churned_buyers: number;
  churn_rate: number;
  at_risk_buyers: number;
}

export interface TopCustomer {
  user_id: string | null;
  buyer_email: string | null;
  buyer_name: string | null;
  total_spent: number;
  purchase_count: number;
  last_purchase_at: string;
  first_purchase_at: string;
}

export interface RevenueBreakdown {
  product_id: string;
  product_title: string;
  revenue: number;
  units_sold: number;
  unique_buyers: number;
}

export function useBuyerCohorts(orgId?: string) {
  return useQuery({
    queryKey: ['buyer-cohorts', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.rpc('get_buyer_cohorts', { _org_id: orgId });
      if (error) throw error;
      return (data || []) as BuyerCohort[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChurnMetrics(orgId?: string) {
  return useQuery({
    queryKey: ['churn-metrics', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase.rpc('get_org_churn_metrics', { _org_id: orgId });
      if (error) throw error;
      return ((data || [])[0] || null) as ChurnMetrics | null;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopCustomers(orgId?: string, limit = 20) {
  return useQuery({
    queryKey: ['top-customers', orgId, limit],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.rpc('get_top_customers', { _org_id: orgId, _limit: limit });
      if (error) throw error;
      return (data || []) as TopCustomer[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenueBreakdown(orgId?: string, days = 90) {
  return useQuery({
    queryKey: ['revenue-breakdown', orgId, days],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.rpc('get_revenue_breakdown', { _org_id: orgId, _days: days });
      if (error) throw error;
      return (data || []) as RevenueBreakdown[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}
