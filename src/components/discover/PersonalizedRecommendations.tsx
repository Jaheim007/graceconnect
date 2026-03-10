import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard } from '@/components/products/ProductCard';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Smart recommendations based on user's purchase history and org memberships.
 * Shows products from orgs the user follows but hasn't purchased yet,
 * plus trending products from other orgs.
 */
export function PersonalizedRecommendations() {
  const { user } = useAuth();

  const { data: recommendations = [] } = useQuery({
    queryKey: ['personalized-recs', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get orgs user is member of
      const { data: memberships } = await db.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);
      const orgIds = (memberships || []).map((m: any) => m.organization_id);

      // Get already purchased product IDs
      const { data: purchased } = await db.from('product_purchases')
        .select('product_id')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      const purchasedIds = new Set((purchased || []).map((p: any) => p.product_id));

      // Get products from followed orgs that user hasn't purchased
      let results: any[] = [];
      if (orgIds.length > 0) {
        const { data: orgProducts } = await db.from('digital_products')
          .select('id, title, description, price, currency, cover_image_url, organization_id, sales_count, average_rating, is_free, slug, organizations(name, slug, is_verified)')
          .in('organization_id', orgIds)
          .eq('is_published', true)
          .order('sales_count', { ascending: false })
          .limit(10);
        results = (orgProducts || []).filter((p: any) => !purchasedIds.has(p.id));
      }

      // If not enough, add trending from other orgs
      if (results.length < 6) {
        const { data: trending } = await db.from('digital_products')
          .select('id, title, description, price, currency, cover_image_url, organization_id, sales_count, average_rating, is_free, slug, organizations(name, slug, is_verified)')
          .eq('is_published', true)
          .order('sales_count', { ascending: false })
          .limit(12);
        for (const p of trending || []) {
          if (!purchasedIds.has(p.id) && !results.find((r: any) => r.id === p.id)) {
            results.push(p);
          }
          if (results.length >= 8) break;
        }
      }

      return results.slice(0, 8);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!user || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">Recommandé pour vous</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {recommendations.map((product: any) => (
          <ProductCard key={product.id} product={product} hideCommission hideShare />
        ))}
      </div>
    </motion.div>
  );
}
