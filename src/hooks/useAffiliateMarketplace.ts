// Affiliate marketplace: cross-org browse
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

// All products with affiliation from all orgs
export function useAffiliateMarketplace(search?: string) {
  return useQuery({
    queryKey: ['affiliate-marketplace', search],
    queryFn: async () => {
      let query = db.from('digital_products')
        .select('id, title, description, cover_image_url, price, sale_price, sale_ends_at, currency, is_free, is_pwyw, min_price, product_type, sales_count, slug, created_at, featured_score, organization_id, organizations!inner(id, name, slug, logo_url, affiliation_enabled, affiliation_commission_percent, is_verified)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .eq('organizations.affiliation_enabled', true)
        .order('sales_count', { ascending: false })
        .limit(100);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
  });
}

// Leaderboard and rank functions REMOVED — no ranking/comparison features
