import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/products/ProductCard';
import { ShoppingCart, Eye, Clock } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

function mapProducts(data: any[]) {
  return data.map((p: any) => ({
    ...p,
    organization_name: p.organizations?.name,
    organization_slug: p.organizations?.slug,
    organization_logo: p.organizations?.logo_url,
    is_org_verified: p.organizations?.is_verified,
  }));
}

function ProductRow({ title, icon, products }: { title: string; icon: React.ReactNode; products: any[] }) {
  if (products.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p: any, i: number) => (
          <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.04 }}>
            <ProductCard product={p} hideCommission hideShare />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FeaturedSection() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data } = useQuery({
    queryKey: ['discover-smart-sections'],
    queryFn: async () => {
      const [mostBought, mostViewed, mostRecent] = await Promise.all([
        // Most bought: ONLY products with at least 1 sale, exclude express demos
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency, is_verified)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .gt('sales_count', 0)
          .order('sales_count', { ascending: false })
          .limit(8),
        // Most viewed: exclude express demos
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency, is_verified)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .order('featured_score', { ascending: false })
          .limit(8),
        // Most recent: exclude express demos
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      return {
        mostBought: mapProducts(mostBought.data || []),
        mostViewed: mapProducts(mostViewed.data || []),
        mostRecent: mapProducts(mostRecent.data || []),
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  // Deduplicate: recent first, then bought, then viewed
  const recentIds = new Set(data.mostRecent.map((p: any) => p.id));
  const boughtFiltered = data.mostBought.filter((p: any) => !recentIds.has(p.id));
  const usedIds = new Set([...recentIds, ...boughtFiltered.map((p: any) => p.id)]);
  const viewedFiltered = data.mostViewed.filter((p: any) => !usedIds.has(p.id));

  return (
    <div className="space-y-2">
      <ProductRow
        title={isFr ? '🕐 Ajoutés récemment' : '🕐 Recently Added'}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        products={data.mostRecent.slice(0, 4)}
      />
      <ProductRow
        title={isFr ? '🛒 Les plus vendus' : '🛒 Best Sellers'}
        icon={<ShoppingCart className="h-4 w-4 text-primary" />}
        products={boughtFiltered.slice(0, 4)}
      />
      <ProductRow
        title={isFr ? '👀 Les plus consultés' : '👀 Most Viewed'}
        icon={<Eye className="h-4 w-4 text-accent" />}
        products={viewedFiltered.slice(0, 4)}
      />
    </div>
  );
}
