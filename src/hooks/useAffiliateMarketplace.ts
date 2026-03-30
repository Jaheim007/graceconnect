// Affiliate marketplace: cross-org browse
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

// All products with affiliation from all orgs
export function useAffiliateMarketplace(search?: string) {
  return useQuery({
    queryKey: ['affiliate-marketplace', search],
    queryFn: async () => {
      let query = db.from('digital_products')
        .select('id, title, cover_image_url, price, sale_price, sale_ends_at, currency, is_free, product_type, sales_count, slug, created_at, organizations!inner(id, name, slug, logo_url, affiliation_enabled, affiliation_commission_percent)')
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

// Leaderboard and rank functions REMOVED — no ranking/comparison features
