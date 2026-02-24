// Affiliate marketplace: cross-org browse + leaderboard
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

// Top affiliates across all orgs (leaderboard)
export function useAffiliateLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['affiliate-leaderboard', limit],
    queryFn: async () => {
      const { data } = await db.from('affiliate_links')
        .select('user_id, code, clicks, conversions, total_earned, organizations(name, slug, logo_url)')
        .gt('total_earned', 0)
        .order('total_earned', { ascending: false })
        .limit(limit);
      return data || [];
    },
  });
}

// All products with affiliation from all orgs
export function useAffiliateMarketplace(search?: string) {
  return useQuery({
    queryKey: ['affiliate-marketplace', search],
    queryFn: async () => {
      let query = db.from('digital_products')
        .select('id, title, cover_image_url, price, currency, is_free, product_type, sales_count, slug, organizations!inner(id, name, slug, logo_url, affiliation_enabled, affiliation_commission_percent)')
        .eq('is_published', true)
        .eq('organizations.affiliation_enabled', true)
        .order('sales_count', { ascending: false })
        .limit(50);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
  });
}

// User's affiliate stats for ranking
export function useMyAffiliateRank() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-affiliate-rank', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: links } = await db.from('affiliate_links')
        .select('total_earned, clicks, conversions')
        .eq('user_id', user.id);
      if (!links?.length) return null;
      const totalEarned = links.reduce((s: number, l: any) => s + (l.total_earned || 0), 0);
      const totalClicks = links.reduce((s: number, l: any) => s + (l.clicks || 0), 0);
      const totalConversions = links.reduce((s: number, l: any) => s + (l.conversions || 0), 0);

      // Count how many affiliates earned more
      const { count } = await db.from('affiliate_links')
        .select('user_id', { count: 'exact', head: true })
        .gt('total_earned', totalEarned);

      return { totalEarned, totalClicks, totalConversions, rank: (count || 0) + 1 };
    },
    enabled: !!user,
  });
}
