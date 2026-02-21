import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, TrendingUp, Sparkles, ShoppingBag, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('products');

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['marketplace-products', search],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(50);
      if (search) {
        q = q.ilike('title', `%${search}%`);
      }
      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
      }));
    },
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['marketplace-campaigns', search],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_active', true)
        .order('current_amount', { ascending: false })
        .limit(50);
      if (search) {
        q = q.ilike('title', `%${search}%`);
      }
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
      {/* Hero */}
      <div className="hero-gradient text-primary-foreground py-12 px-4 border-b border-border/40">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <Badge variant="secondary" className="text-[10px] bg-white/10 text-white border-0">Marketplace</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Marketplace Siteviral</h1>
          <p className="text-sm opacity-80 mb-5">Découvrez les meilleurs produits et campagnes de notre communauté.</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            <Input
              placeholder="Rechercher produits, campagnes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> Produits ({products.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Heart className="h-3.5 w-3.5" /> Campagnes ({campaigns.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {loadingProducts ? <SkeletonList count={8} /> : products.length === 0 ? (
              <EmptyState variant="search" title="Aucun produit trouvé" />
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p: any) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="campaigns">
            {loadingCampaigns ? <SkeletonList count={6} /> : campaigns.length === 0 ? (
              <EmptyState variant="search" title="Aucune campagne trouvée" />
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((c: any) => (
                  <motion.div key={c.id} variants={fadeUp}>
                    <CampaignCard campaign={c} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
