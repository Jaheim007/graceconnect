import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AcquisitionOverview = {
  page_views: number;
  visitors: number;
  signups: number;
  by_source: { source: string; views: number }[];
  signup_sources: { source: string; signups: number }[];
  by_device: { device: string; views: number }[];
  by_hour: { hour: number; views: number }[];
  top_pages: { path: string; views: number }[];
  by_day: { day: string; views: number }[];
};

export type SellerFunnel = {
  workspaces: number;
  with_product: number;
  with_published: number;
  with_sale: number;
  median_hours_to_product: number | null;
  median_hours_to_publish: number | null;
  median_hours_to_sale: number | null;
  by_type: { type: string; workspaces: number }[];
  by_country: { country: string; workspaces: number }[];
};

export type FirstSaleHealth = {
  published_total: number;
  never_sold_total: number;
  never_sold: {
    product_id: string;
    title: string;
    org_name: string;
    org_slug: string;
    price: number | null;
    currency: string | null;
    created_at: string;
    days_live: number;
    missing_cover: boolean;
    missing_description: boolean;
    no_commission: boolean;
  }[];
  dormant_sellers: {
    org_id: string;
    org_name: string;
    org_slug: string;
    created_at: string;
    days_since_last_sale: number | null;
  }[];
};

export type AffiliatePerformance = {
  ambassadors: number;
  active_ambassadors: number;
  links: number;
  clicks: number;
  conversions: number;
  commission_total: number;
  gross_total: number;
  top_ambassadors: { user_id: string; name: string; conversions: number; commission: number }[];
};

export type MoneyOverview = {
  orders: number;
  gmv: number;
  platform_fees: number;
  affiliate_commissions: number;
  seller_payouts: number;
  paying_sellers: number;
  by_currency: { currency: string; orders: number; gmv: number; fees: number }[];
  by_gateway: { gateway: string; orders: number; gmv: number }[];
  marketing_spend: number;
  spend_by_channel: { channel: string; amount: number; currency: string }[];
  cost_per_paying_seller: number | null;
};

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw error;
  return data as T;
}

export function useAcquisitionConsole(days: number, excludeInternal: boolean) {
  const key = [days, excludeInternal] as const;

  const overview = useQuery({
    queryKey: ['acq-overview', ...key],
    queryFn: () => rpc<AcquisitionOverview>('get_acquisition_overview', { p_days: days, p_exclude_internal: excludeInternal }),
  });

  const funnel = useQuery({
    queryKey: ['acq-funnel', ...key],
    queryFn: () => rpc<SellerFunnel>('get_seller_funnel', { p_days: days, p_exclude_internal: excludeInternal }),
  });

  const health = useQuery({
    queryKey: ['acq-health', excludeInternal],
    queryFn: () => rpc<FirstSaleHealth>('get_first_sale_health', { p_exclude_internal: excludeInternal, p_limit: 50 }),
  });

  const affiliates = useQuery({
    queryKey: ['acq-affiliates', ...key],
    queryFn: () => rpc<AffiliatePerformance>('get_affiliate_performance', { p_days: days, p_exclude_internal: excludeInternal }),
  });

  const money = useQuery({
    queryKey: ['acq-money', ...key],
    queryFn: () => rpc<MoneyOverview>('get_money_overview', { p_days: days, p_exclude_internal: excludeInternal }),
  });

  return { overview, funnel, health, affiliates, money };
}
