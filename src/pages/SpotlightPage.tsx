import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { SEOHead } from '@/components/seo/SEOHead';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Flame, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function SpotlightPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: featuredProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['spotlight-products'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, kyc_status)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('featured_score', { ascending: false })
        .limit(12);
      return data || [];
    },
  });

  const { data: trendingProducts = [], isLoading: loadingTrending } = useQuery({
    queryKey: ['spotlight-trending'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, kyc_status)')
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const { data: featuredCampaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['spotlight-campaigns'],
    queryFn: async () => {
      const { data } = await db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, kyc_status)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('featured_score', { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const isLoading = loadingProducts || loadingTrending || loadingCampaigns;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Spotlight — Découvrez les meilleures créations' : 'Spotlight — Discover the best creations'}
        description={isFr ? 'Les produits et campagnes les plus populaires sur Siteviral. Découvrez les créateurs qui cartonnent.' : 'The most popular products and campaigns on Siteviral. Discover trending creators.'}
        canonicalUrl="https://siteviral.com/spotlight"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Spotlight</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            {isFr ? 'Les créations qui' : 'Creations that'} <span className="text-primary">{isFr ? 'cartonnent' : 'shine'}</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {isFr ? 'Produits vedettes, campagnes tendances et créateurs à suivre.' : 'Featured products, trending campaigns and creators to follow.'}
          </p>
        </div>

        {isLoading ? <SkeletonList count={6} /> : (
          <>
            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-bold">{isFr ? 'Sélection vedette' : 'Featured picks'}</h2>
                  <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">⭐ Curated</Badge>
                </div>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredProducts.map((p: any) => (
                    <motion.div key={p.id} variants={fadeUp}>
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Trending */}
            {trendingProducts.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold">{isFr ? 'Tendances' : 'Trending'}</h2>
                  <Badge className="bg-orange-500/10 text-orange-600 border-0 text-[10px]">🔥 Hot</Badge>
                </div>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {trendingProducts.map((p: any) => (
                    <motion.div key={p.id} variants={fadeUp}>
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Featured Campaigns */}
            {featuredCampaigns.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-xl font-bold">{isFr ? 'Campagnes à soutenir' : 'Campaigns to support'}</h2>
                </div>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredCampaigns.map((c: any) => (
                    <motion.div key={c.id} variants={fadeUp}>
                      <CampaignCard campaign={c} />
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {featuredProducts.length === 0 && trendingProducts.length === 0 && featuredCampaigns.length === 0 && (
              <EmptyState
                variant="generic"
                title={isFr ? 'Rien à afficher pour le moment' : 'Nothing to show yet'}
                description={isFr ? 'Les produits et campagnes vedettes apparaîtront ici bientôt.' : 'Featured products and campaigns will appear here soon.'}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
