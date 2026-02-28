import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, ShoppingBag, Heart, HandHeart, SlidersHorizontal, ArrowUpDown, Star, TrendingUp } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { OfferingCard } from '@/components/offerings/OfferingCard';
import { OfferingModal } from '@/components/offerings/OfferingModal';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { PageTour } from '@/components/onboarding/PageTour';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingBanner } from '@/components/discover/TrendingBanner';
import { DiscoverCTABanner } from '@/components/discover/DiscoverCTABanner';
import { Offering } from '@/hooks/useOfferings';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

const DISCOVER_TOUR_STEPS = [
  { titleKey: 'tour.discover_1_title', descKey: 'tour.discover_1_desc', icon: <Search className="h-4 w-4" /> },
  { titleKey: 'tour.discover_2_title', descKey: 'tour.discover_2_desc', icon: <ShoppingBag className="h-4 w-4" /> },
  { titleKey: 'tour.discover_3_title', descKey: 'tour.discover_3_desc', icon: <Heart className="h-4 w-4" /> },
];

type ProductSort = 'mixed' | 'popular' | 'recent' | 'price_asc' | 'price_desc' | 'rating' | 'best_selling' | 'most_viewed';

/** Interleave products so no single org dominates consecutive slots */
function mixByOrg(products: any[]): any[] {
  if (products.length === 0) return [];
  // Group by org
  const byOrg = new Map<string, any[]>();
  for (const p of products) {
    const key = p.organization_id || 'unknown';
    if (!byOrg.has(key)) byOrg.set(key, []);
    byOrg.get(key)!.push(p);
  }
  // Round-robin interleave, largest orgs first
  const queues = [...byOrg.values()].sort((a, b) => b.length - a.length);
  const result: any[] = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const queue of queues) {
      if (queue.length > 0) {
        result.push(queue.shift()!);
        remaining = remaining || queue.length > 0;
      }
    }
  }
  return result;
}
type PriceFilter = 'all' | 'free' | 'paid';
type ProductTypeFilter = '' | 'pdf' | 'ebook' | 'audio' | 'video' | 'link' | 'bundle';

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('products');
  const [sortBy, setSortBy] = useState<ProductSort>('mixed');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('');
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const debouncedSearch = useDebounce(search, 300);

  const PRODUCT_TYPES = [
    { value: '', label: locale === 'fr' ? 'Tous types' : 'All types' },
    { value: 'pdf', label: 'PDF' },
    { value: 'ebook', label: 'E-book' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Vidéo' },
    { value: 'link', label: locale === 'fr' ? 'Lien' : 'Link' },
    { value: 'bundle', label: 'Bundle' },
  ];

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['discover-products', debouncedSearch, sortBy, priceFilter, typeFilter],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_express_demo', false);

      if (debouncedSearch) q = q.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
      if (priceFilter === 'free') q = q.eq('is_free', true);
      if (priceFilter === 'paid') q = q.eq('is_free', false);
      if (typeFilter === 'bundle') q = q.eq('is_bundle', true);
      else if (typeFilter) q = q.eq('product_type', typeFilter);

      // For 'mixed', fetch by featured_score but we'll interleave client-side
      if (sortBy === 'mixed' || sortBy === 'popular') q = q.order('featured_score', { ascending: false }).order('sales_count', { ascending: false });
      else if (sortBy === 'recent') q = q.order('created_at', { ascending: false });
      else if (sortBy === 'price_asc') q = q.order('price', { ascending: true });
      else if (sortBy === 'price_desc') q = q.order('price', { ascending: false });
      else if (sortBy === 'rating') q = q.order('average_rating', { ascending: false });
      else if (sortBy === 'best_selling') q = q.order('sales_count', { ascending: false });
      else if (sortBy === 'most_viewed') q = q.order('featured_score', { ascending: false });

      q = q.limit(60);
      const { data } = await q;
      const mapped = (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
      }));
      // Apply mix algorithm for default view
      return sortBy === 'mixed' ? mixByOrg(mapped) : mapped;
    },
    enabled: tab === 'products',
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['discover-campaigns', debouncedSearch],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_active', true)
        .eq('is_express_demo', false)
        .order('current_amount', { ascending: false })
        .limit(50);
      if (debouncedSearch) q = q.ilike('title', `%${debouncedSearch}%`);
      const { data } = await q;
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
      }));
    },
    enabled: tab === 'campaigns',
  });

  const { data: offerings = [], isLoading: loadingOfferings } = useQuery({
    queryKey: ['discover-offerings', debouncedSearch],
    queryFn: async () => {
      let q = db
        .from('offerings')
        .select('*, organizations!inner(name, slug, logo_url, currency, offerings_enabled)')
        .eq('is_active', true)
        .eq('organizations.offerings_enabled', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (debouncedSearch) q = q.ilike('title', `%${debouncedSearch}%`);
      const { data } = await q;
      return (data || []).map((o: any) => ({
        ...o,
        organization_name: o.organizations?.name,
        organization_slug: o.organizations?.slug,
      }));
    },
    enabled: tab === 'offerings',
  });

  const isSearching = debouncedSearch.length > 0;

  return (
    <div className="bg-background min-h-screen">
      <SEOHead title={t('discover.seo_title')} description={t('discover.seo_desc')} />
      <div className="border-b border-border py-6 px-4">
        <div className="container max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">{t('discover.title')}</h1>
          <p className="text-muted-foreground text-sm mb-4">{t('discover.subtitle')}</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('discover.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              className="pl-10 h-11 bg-card/80"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6">
        <PageTour pageId="discover" steps={DISCOVER_TOUR_STEPS} />

        {!isSearching && !user && <DiscoverCTABanner />}
        {!isSearching && <TrendingBanner />}

        <Tabs value={tab} onValueChange={(v) => setTab(v)}>
          <TabsList className="mb-4">
            <TabsTrigger value="products" className="gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> {t('discover.resources')}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Heart className="h-3.5 w-3.5" /> {t('discover.campaigns')}
            </TabsTrigger>
            <TabsTrigger value="offerings" className="gap-1.5">
              <HandHeart className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Dons' : 'Donations'}
            </TabsTrigger>
          </TabsList>

          {/* ═══ Products Tab ═══ */}
          <TabsContent value="products">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as ProductSort)}>
                <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">{locale === 'fr' ? '🔀 Mix' : '🔀 Mix'}</SelectItem>
                  <SelectItem value="popular"><TrendingUp className="h-3 w-3 inline mr-1" />{locale === 'fr' ? 'Populaires' : 'Popular'}</SelectItem>
                  <SelectItem value="recent">{locale === 'fr' ? 'Récents' : 'Recent'}</SelectItem>
                  <SelectItem value="best_selling">{locale === 'fr' ? 'Plus vendus' : 'Best selling'}</SelectItem>
                  <SelectItem value="most_viewed">{locale === 'fr' ? 'Plus consultés' : 'Most viewed'}</SelectItem>
                  <SelectItem value="rating"><Star className="h-3 w-3 inline mr-1" />{locale === 'fr' ? 'Mieux notés' : 'Top rated'}</SelectItem>
                  <SelectItem value="price_asc">{locale === 'fr' ? 'Prix ↑' : 'Price ↑'}</SelectItem>
                  <SelectItem value="price_desc">{locale === 'fr' ? 'Prix ↓' : 'Price ↓'}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                {(['all', 'free', 'paid'] as PriceFilter[]).map((pf) => (
                  <Button key={pf} size="sm" variant={priceFilter === pf ? 'default' : 'outline'} className="h-8 text-xs px-3" onClick={() => setPriceFilter(pf)}>
                    {pf === 'all' ? (locale === 'fr' ? 'Tous' : 'All') : pf === 'free' ? (locale === 'fr' ? 'Gratuit' : 'Free') : (locale === 'fr' ? 'Payant' : 'Paid')}
                  </Button>
                ))}
              </div>

              <Select value={typeFilter || '_all'} onValueChange={(v) => setTypeFilter(v === '_all' ? '' : v as ProductTypeFilter)}>
                <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  <SelectValue placeholder={locale === 'fr' ? 'Type' : 'Type'} />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((pt) => (
                    <SelectItem key={pt.value || '_all'} value={pt.value || '_all'}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

            {loadingProducts ? <SkeletonList count={8} /> : products.length === 0 ? (
              <EmptyState variant="search" title={t('discover.no_products')} />
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

          {/* ═══ Campaigns Tab ═══ */}
          <TabsContent value="campaigns">
            {loadingCampaigns ? <SkeletonList count={6} /> : campaigns.length === 0 ? (
              <EmptyState variant="search" title={t('discover.no_campaigns')} />
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

          {/* ═══ Offerings/Dons Tab ═══ */}
          <TabsContent value="offerings">
            {loadingOfferings ? <SkeletonList count={6} /> : offerings.length === 0 ? (
              <EmptyState variant="generic" title={locale === 'fr' ? 'Aucun don disponible' : 'No donations available'} description={locale === 'fr' ? 'Aucune organisation n\'a configuré de dons pour le moment.' : 'No organizations have configured donations yet.'} />
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {offerings.map((o: any) => (
                  <motion.div key={o.id} variants={fadeUp}>
                    <div className="relative">
                      {o.organization_name && (
                        <button onClick={() => navigate(`/org/${o.organization_slug}`)} className="text-[10px] text-muted-foreground hover:text-primary mb-1 block">{o.organization_name}</button>
                      )}
                      <OfferingCard offering={o} onSelect={setSelectedOffering} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedOffering && (
        <OfferingModal
          offering={selectedOffering}
          organizationId={selectedOffering.organization_id}
          open={!!selectedOffering}
          onClose={() => setSelectedOffering(null)}
        />
      )}
    </div>
  );
}
