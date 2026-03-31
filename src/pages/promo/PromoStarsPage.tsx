import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { PromoLayout } from './PromoLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Loader2, Star, TrendingUp, Flame } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function PromoStarsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data, isLoading } = useQuery({
    queryKey: ['promo-stars'],
    queryFn: async () => {
      const [bestSellers, trending, topRated] = await Promise.all([
        // Best sellers: most sales
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .eq('is_free', false)
          .gt('sales_count', 0)
          .order('sales_count', { ascending: false })
          .limit(20),
        // Trending: highest featured_score (recent views + engagement)
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .eq('is_free', false)
          .order('featured_score', { ascending: false })
          .limit(20),
        // Top rated
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .eq('is_free', false)
          .gt('average_rating', 0)
          .order('average_rating', { ascending: false })
          .limit(20),
      ]);

      const map = (arr: any[]) => arr.map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
      }));

      return {
        bestSellers: map(bestSellers.data || []),
        trending: map(trending.data || []),
        topRated: map(topRated.data || []),
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <PromoLayout
      title={isFr ? 'Produits Stars' : 'Star Products'}
      description={isFr ? 'Les produits les plus vendus et les plus prometteurs de la plateforme' : 'The best-selling and most promising products on the platform'}
      seoTitle={isFr ? 'Produits stars & best-sellers - SiteViral' : 'Star products & best-sellers - SiteViral'}
      seoDesc={isFr ? 'Découvre les produits les plus achetés et les mieux notés' : 'Discover the most purchased and top-rated products'}
      emoji="⭐"
    >
      {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

      {data && (
        <div className="space-y-10">
          {/* Best Sellers */}
          {data.bestSellers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-bold">{isFr ? 'Best-sellers' : 'Best Sellers'}</h2>
                <Badge variant="secondary" className="text-xs">{data.bestSellers.length}</Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.bestSellers.map((p: any, i: number) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <ProductCard product={p} hideCommission hideShare />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Trending */}
          {data.trending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{isFr ? 'En tendance' : 'Trending'}</h2>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.trending.slice(0, 12).map((p: any, i: number) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <ProductCard product={p} hideCommission hideShare />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Top Rated */}
          {data.topRated.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-bold">{isFr ? 'Les mieux notés' : 'Top Rated'}</h2>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.topRated.slice(0, 12).map((p: any, i: number) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <ProductCard product={p} hideCommission hideShare />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PromoLayout>
  );
}
