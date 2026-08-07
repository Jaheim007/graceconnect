import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/products/ProductCard';
import { Zap, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

interface CrossSellWidgetProps {
  productId: string;
  organizationId: string;
  productType?: string;
}

/**
 * Shows "Buyers also purchased" recommendations based on:
 * 1. Other products bought by users who purchased this product
 * 2. Other products from the same organization
 * 3. Similar product types across the platform
 */
export function CrossSellWidget({ productId, organizationId, productType }: CrossSellWidgetProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: recommendations = [] } = useQuery({
    queryKey: ['cross-sell', productId, organizationId],
    queryFn: async () => {
      const results: any[] = [];
      const excludeIds = new Set([productId]);

      // 1. Co-purchase: find users who bought this product, then what else they bought
      const { data: buyers } = await db.from('product_purchases')
        .select('user_id')
        .eq('product_id', productId)
        .eq('status', 'completed')
        .limit(50);

      if (buyers?.length) {
        const buyerIds = [...new Set(buyers.map((b: any) => b.user_id))];
        const { data: coPurchases } = await db.from('product_purchases')
          .select('product_id, digital_products(*, organizations(name, slug, logo_url, currency))')
          .in('user_id', buyerIds)
          .eq('status', 'completed')
          .neq('product_id', productId)
          .limit(20);

        if (coPurchases) {
          // Count frequency of each co-purchased product
          const freq = new Map<string, { count: number; product: any }>();
          for (const cp of coPurchases) {
            const prod = (cp as any).digital_products;
            if (!prod || !prod.is_published || prod.is_express_demo) continue;
            const existing = freq.get(cp.product_id);
            if (existing) {
              existing.count++;
            } else {
              freq.set(cp.product_id, {
                count: 1,
                product: {
                  ...prod,
                  organization_name: prod.organizations?.name,
                  organization_slug: prod.organizations?.slug,
                  organization_logo: prod.organizations?.logo_url,
                },
              });
            }
          }

          // Sort by frequency
          const sorted = [...freq.entries()].sort((a, b) => b[1].count - a[1].count);
          for (const [id, { product }] of sorted.slice(0, 4)) {
            if (!excludeIds.has(id)) {
              results.push(product);
              excludeIds.add(id);
            }
          }
        }
      }

      // 2. Same org products (fill up to 4)
      if (results.length < 4) {
        const { data: orgProducts } = await db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency)')
          .eq('organization_id', organizationId)
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .order('sales_count', { ascending: false })
          .limit(8);

        for (const p of orgProducts || []) {
          if (results.length >= 4) break;
          if (!excludeIds.has(p.id)) {
            results.push({
              ...p,
              organization_name: p.organizations?.name,
              organization_slug: p.organizations?.slug,
              organization_logo: p.organizations?.logo_url,
            });
            excludeIds.add(p.id);
          }
        }
      }

      // 3. Same type across platform (fill up to 4)
      if (results.length < 4 && productType) {
        const { data: typeProducts } = await db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .eq('product_type', productType)
          .order('sales_count', { ascending: false })
          .limit(8);

        for (const p of typeProducts || []) {
          if (results.length >= 4) break;
          if (!excludeIds.has(p.id)) {
            results.push({
              ...p,
              organization_name: p.organizations?.name,
              organization_slug: p.organizations?.slug,
              organization_logo: p.organizations?.logo_url,
            });
            excludeIds.add(p.id);
          }
        }
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (recommendations.length === 0) return null;

  const hasCoData = recommendations.length > 0;
  const title = hasCoData
    ? (isFr ? '🛒 Les acheteurs ont aussi aimé' : '🛒 Buyers also liked')
    : (isFr ? 'Vous pourriez aimer' : 'You might like');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-base font-bold">{title}</h3>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((p: any, i: number) => (
          <motion.div
            key={p.id}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: i * 0.05 }}
          >
            <ProductCard product={p} hideCommission hideShare />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
