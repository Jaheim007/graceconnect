import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, TrendingUp, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['marketplace-products', search, sortBy],
    queryFn: async () => {
      const orderCol = sortBy === 'commission' ? 'price' : sortBy === 'newest' ? 'created_at' : 'sales_count';
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, affiliation_commission_percent)')
        .eq('is_published', true)
        .order(orderCol, { ascending: false })
        .limit(50);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        commission_percent: p.organizations?.affiliation_commission_percent,
      }));
    },
  });

  // Campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['marketplace-campaigns', search],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_active', true)
        .order('current_amount', { ascending: false })
        .limit(20);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
      }));
    },
  });

  return (
    <div className="bg-background min-h-screen">
      <SEOHead
        title="Marketplace — Produits numériques | Siteviral"
        description="Explorez les meilleurs produits numériques. Partagez et gagnez des commissions."
        canonicalUrl="https://siteviral.com/marketplace"
      />

      {/* Clean header */}
      <div className="border-b border-border bg-muted/30 py-8 px-4">
        <div className="container max-w-4xl space-y-4">
          <h1 className="text-xl sm:text-2xl font-extrabold">Marketplace</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            {/* 2 filters only */}
            <div className="flex gap-1.5">
              <Button
                variant={sortBy === 'commission' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-10 gap-1"
                onClick={() => setSortBy(sortBy === 'commission' ? 'popular' : 'commission')}
              >
                <TrendingUp className="h-3.5 w-3.5" /> Meilleure commission
              </Button>
              <Button
                variant={sortBy === 'newest' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-10 gap-1"
                onClick={() => setSortBy(sortBy === 'newest' ? 'popular' : 'newest')}
              >
                <Sparkles className="h-3.5 w-3.5" /> Nouveautés
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6 px-4 space-y-6">
        {/* Products */}
        {isLoading ? <SkeletonList count={8} /> : products.length === 0 ? (
          <EmptyState variant="search" title="Aucun produit trouvé" />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {products.map((p: any) => (
              <motion.div key={p.id} variants={fadeUp}><ProductCard product={p} /></motion.div>
            ))}
          </motion.div>
        )}

        {/* Campaigns if any */}
        {campaigns.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="font-bold text-sm text-muted-foreground">Campagnes de dons</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c: any) => (
                <motion.div key={c.id} variants={fadeUp} initial="hidden" animate="visible">
                  <CampaignCard campaign={c} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
