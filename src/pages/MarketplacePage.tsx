import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, TrendingUp, Sparkles, ShoppingBag, Heart, Star, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageTour } from '@/components/onboarding/PageTour';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const TOUR_STEPS = [
  { titleKey: 'tour.explorer_1_title', descKey: 'tour.explorer_1_desc', icon: <Sparkles className="h-4 w-4" /> },
  { titleKey: 'tour.explorer_2_title', descKey: 'tour.explorer_2_desc', icon: <ShoppingBag className="h-4 w-4" /> },
];

const PRODUCT_TYPES = [
  { key: 'all', label: 'Tous' },
  { key: 'pdf', label: 'PDF' },
  { key: 'ebook', label: 'eBook' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Vidéo' },
  { key: 'course', label: 'Cours' },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('products');
  const [typeFilter, setTypeFilter] = useState('all');
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';

  // Most bought products
  const { data: mostBought = [] } = useQuery({
    queryKey: ['marketplace-most-bought'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(6);
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
      }));
    },
  });

  // All products with filter
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['marketplace-products', search, typeFilter],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(50);
      if (search) q = q.ilike('title', `%${search}%`);
      if (typeFilter !== 'all') q = q.eq('product_type', typeFilter);
      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
      }));
    },
  });

  // Campaigns
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
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
      }));
    },
  });

  // Trending orgs
  const { data: trendingOrgs = [] } = useQuery({
    queryKey: ['marketplace-trending-orgs'],
    queryFn: async () => {
      const { data } = await db
        .from('organizations')
        .select('id, name, slug, logo_url, description, category')
        .eq('is_active', true)
        .eq('is_verified', true)
        .limit(8);
      return data || [];
    },
  });

  return (
    <div className="bg-background min-h-screen">
      <SEOHead
        title="Marketplace — Acheter ebooks et contenus numériques | Siteviral"
        description="Explorez et achetez les meilleurs produits numériques : ebooks, audio, vidéos et ressources exclusives. Paiement Mobile Money et carte."
        canonicalUrl="https://siteviral.com/marketplace"
        keywords="acheter ebook, produits numériques, audio, vidéo, marketplace Afrique, contenu digital, Mobile Money"
      />
      {/* Hero */}
      <div className="hero-gradient text-primary-foreground py-12 px-4 border-b border-border/40">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="text-[10px] bg-white/10 text-white border-0">{t('page.explorer')}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">{t('page.explorer')}</h1>
          <p className="text-sm opacity-80 mb-5">{t('page.explorer_desc')}</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            <Input
              placeholder={t('page.explorer_search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6 space-y-6">
        <PageTour pageId="explorer" steps={TOUR_STEPS} />

        {/* Featured products carousel */}
        {mostBought.length > 0 && tab === 'products' && !search && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{isFr ? 'Les plus achetés' : 'Most Bought'}</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {mostBought.map((p: any) => (
                <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="visible">
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Trending orgs */}
        {trendingOrgs.length > 0 && !search && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{isFr ? 'Organisations populaires' : 'Trending Organizations'}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {trendingOrgs.map((org: any) => (
                <a key={org.id} href={`/org/${org.slug}`} className="shrink-0 w-36 bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-colors text-center">
                  <div className="h-10 w-10 rounded-full bg-muted mx-auto mb-2 overflow-hidden">
                    {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs font-bold">{org.name[0]}</span>}
                  </div>
                  <p className="text-xs font-medium truncate">{org.name}</p>
                  <Badge variant="outline" className="text-[9px] mt-1">{org.category}</Badge>
                </a>
              ))}
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center gap-3 flex-wrap">
            <TabsList className="mb-0">
              <TabsTrigger value="products" className="gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" /> {t('page.explorer_products')} ({products.length})
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="gap-1.5">
                <Heart className="h-3.5 w-3.5" /> {t('page.explorer_campaigns')} ({campaigns.length})
              </TabsTrigger>
            </TabsList>

            {/* Type filters for products */}
            {tab === 'products' && (
              <div className="flex gap-1 overflow-x-auto">
                {PRODUCT_TYPES.map((pt) => (
                  <Button
                    key={pt.key}
                    variant={typeFilter === pt.key ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs h-7 shrink-0"
                    onClick={() => setTypeFilter(pt.key)}
                  >
                    {pt.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <TabsContent value="products" className="mt-4">
            {loadingProducts ? <SkeletonList count={8} /> : products.length === 0 ? (
              <EmptyState variant="search" title={t('page.explorer_no_products')} />
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p: any) => (
                  <motion.div key={p.id} variants={fadeUp}><ProductCard product={p} /></motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4">
            {loadingCampaigns ? <SkeletonList count={6} /> : campaigns.length === 0 ? (
              <EmptyState variant="search" title={t('page.explorer_no_campaigns')} />
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((c: any) => (
                  <motion.div key={c.id} variants={fadeUp}><CampaignCard campaign={c} /></motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
