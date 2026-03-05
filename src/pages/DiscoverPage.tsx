import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, ShoppingBag, Heart, HandHeart, Loader2 } from 'lucide-react';
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

import { TrendingBanner } from '@/components/discover/TrendingBanner';
import { DiscoverCTABanner } from '@/components/discover/DiscoverCTABanner';
import { LiveActivityTicker } from '@/components/discover/LiveActivityTicker';
import { FlashSaleCountdown } from '@/components/discover/FlashSaleCountdown';
import { FeaturedSection } from '@/components/discover/FeaturedSection';
import { PlatformStats } from '@/components/discover/PlatformStats';
import { PersonalizedRecommendations } from '@/components/discover/PersonalizedRecommendations';
import { BuyerStreakWidget } from '@/components/discover/BuyerStreakWidget';
import { ForYouFeed } from '@/components/discover/ForYouFeed';
import { CategoryCarousels } from '@/components/discover/CategoryCarousels';
import { useCallback, useRef, useEffect } from 'react';

import { Offering } from '@/hooks/useOfferings';
import { SearchSuggestions, addRecentSearch } from '@/components/discover/SearchSuggestions';
import { ProductQuickView } from '@/components/products/ProductQuickView';
import { RecentlyViewedProducts } from '@/components/discover/RecentlyViewedProducts';
import { EngagementLevel } from '@/components/discover/EngagementLevel';
import { StickyFilterBar } from '@/components/discover/StickyFilterBar';

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
  const byOrg = new Map<string, any[]>();
  for (const p of products) {
    const key = p.organization_id || 'unknown';
    if (!byOrg.has(key)) byOrg.set(key, []);
    byOrg.get(key)!.push(p);
  }
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

const PAGE_SIZE = 20;

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('products');
  const [sortBy, setSortBy] = useState<ProductSort>('mixed');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('');
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const debouncedSearch = useDebounce(search, 300);
  const isFr = locale === 'fr';

  const PRODUCT_TYPES = [
    { value: '', label: isFr ? 'Tous types' : 'All types' },
    { value: 'pdf', label: 'PDF' },
    { value: 'ebook', label: 'E-book' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Vidéo' },
    { value: 'link', label: isFr ? 'Lien' : 'Link' },
    { value: 'bundle', label: 'Bundle' },
  ];

  // C2+C5: Real infinite scroll pagination (removed multiplyContent)
  const productsQuery = useInfiniteQuery({
    queryKey: ['discover-products', debouncedSearch, sortBy, priceFilter, typeFilter],
    queryFn: async ({ pageParam = 0 }) => {
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

      if (sortBy === 'mixed' || sortBy === 'popular') q = q.order('featured_score', { ascending: false }).order('sales_count', { ascending: false });
      else if (sortBy === 'recent') q = q.order('created_at', { ascending: false });
      else if (sortBy === 'price_asc') q = q.order('price', { ascending: true });
      else if (sortBy === 'price_desc') q = q.order('price', { ascending: false });
      else if (sortBy === 'rating') q = q.order('average_rating', { ascending: false });
      else if (sortBy === 'best_selling') q = q.order('sales_count', { ascending: false });
      else if (sortBy === 'most_viewed') q = q.order('featured_score', { ascending: false });

      q = q.range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      const { data } = await q;
      const mapped = (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
      }));
      return { items: sortBy === 'mixed' ? mixByOrg(mapped) : mapped, page: pageParam };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.items.length < PAGE_SIZE) return undefined;
      return lastPage.page + 1;
    },
    initialPageParam: 0,
    enabled: tab === 'products',
    staleTime: 2 * 60 * 1000, // A2: 2min cache
  });

  const products = productsQuery.data?.pages.flatMap(p => p.items) || [];
  const loadingProducts = productsQuery.isLoading;

  // Infinite scroll sentinel
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !productsQuery.hasNextPage || productsQuery.isFetchingNextPage) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && productsQuery.hasNextPage) {
          productsQuery.fetchNextPage();
        }
      }, { rootMargin: '300px' });
      observerRef.current.observe(node);
    },
    [productsQuery.hasNextPage, productsQuery.isFetchingNextPage, productsQuery.fetchNextPage]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const campaignsQuery = useInfiniteQuery({
    queryKey: ['discover-campaigns', debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_active', true)
        .eq('is_express_demo', false)
        .order('current_amount', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      if (debouncedSearch) q = q.ilike('title', `%${debouncedSearch}%`);
      const { data } = await q;
      return {
        items: (data || []).map((c: any) => ({
          ...c,
          organization_name: c.organizations?.name,
          organization_slug: c.organizations?.slug,
        })),
        page: pageParam,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.items.length < PAGE_SIZE ? undefined : lastPage.page + 1,
    initialPageParam: 0,
    enabled: tab === 'campaigns',
    staleTime: 2 * 60 * 1000,
  });
  const campaigns = campaignsQuery.data?.pages.flatMap((p: any) => p.items) ?? [];
  const loadingCampaigns = campaignsQuery.isLoading;

  const offeringsQuery = useInfiniteQuery({
    queryKey: ['discover-offerings', debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      let q = db
        .from('offerings')
        .select('*, organizations!inner(name, slug, logo_url, currency, offerings_enabled)')
        .eq('is_active', true)
        .eq('organizations.offerings_enabled', true)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      if (debouncedSearch) q = q.ilike('title', `%${debouncedSearch}%`);
      const { data } = await q;
      return {
        items: (data || []).map((o: any) => ({
          ...o,
          organization_name: o.organizations?.name,
          organization_slug: o.organizations?.slug,
        })),
        page: pageParam,
      };
    },
    getNextPageParam: (lastPage: any) => lastPage.items.length < PAGE_SIZE ? undefined : lastPage.page + 1,
    initialPageParam: 0,
    enabled: tab === 'offerings',
    staleTime: 2 * 60 * 1000,
  });
  const offerings = offeringsQuery.data?.pages.flatMap((p: any) => p.items) ?? [];
  const loadingOfferings = offeringsQuery.isLoading;

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
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' && search.trim()) { addRecentSearch(search.trim()); setSearchFocused(false); } }}
              className="pl-10 h-11 bg-card/80"
            />
            <SearchSuggestions
              query={search}
              isOpen={searchFocused}
              onSelect={(term) => { setSearch(term); addRecentSearch(term); setSearchFocused(false); }}
              onClose={() => setSearchFocused(false)}
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6">
        <PageTour pageId="discover" steps={DISCOVER_TOUR_STEPS} />

        <LiveActivityTicker />
        {!isSearching && <PlatformStats />}
        {!isSearching && <FlashSaleCountdown />}
        {!isSearching && !user && <DiscoverCTABanner />}
        {!isSearching && user && <BuyerStreakWidget />}
        {!isSearching && <TrendingBanner />}
        {!isSearching && user && <EngagementLevel />}
        {!isSearching && <RecentlyViewedProducts />}

        {!isSearching && <CategoryCarousels />}
        <Tabs value={tab} onValueChange={(v) => setTab(v)}>
          <TabsList className="mb-4">
            <TabsTrigger value="products" className="gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> {t('discover.resources')}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Heart className="h-3.5 w-3.5" /> {t('discover.campaigns')}
            </TabsTrigger>
            <TabsTrigger value="offerings" className="gap-1.5">
              <HandHeart className="h-3.5 w-3.5" /> {isFr ? 'Dons' : 'Donations'}
            </TabsTrigger>
          </TabsList>

          {/* ═══ Products Tab ═══ */}
          <TabsContent value="products">
            <StickyFilterBar
              sortBy={sortBy}
              setSortBy={setSortBy}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
            />

            {loadingProducts ? <SkeletonList count={8} /> : products.length === 0 ? (
              <EmptyState variant="search" title={t('discover.no_products')} />
            ) : (
              <>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((p: any) => (
                    <motion.div key={p.id} variants={fadeUp} onDoubleClick={() => setQuickViewProduct(p)}>
                      <ProductCard product={p} hideCommission hideShare />
                    </motion.div>
                  ))}
                </motion.div>
                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-10" />
                {productsQuery.isFetchingNextPage && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!productsQuery.hasNextPage && products.length > 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    {isFr ? '— Fin des résultats —' : '— End of results —'}
                  </p>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══ Campaigns Tab ═══ */}
          <TabsContent value="campaigns">
            {loadingCampaigns ? <SkeletonList count={6} /> : campaigns.length === 0 ? (
              <EmptyState variant="search" title={isFr ? 'Aucune campagne visible trouvée' : 'No visible campaigns found'} description={isFr ? 'Essayez d\'ajuster votre recherche ou vos filtres.' : 'Try adjusting your search or filters.'} />
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
              <EmptyState variant="generic" title={isFr ? 'Aucun don visible trouvé' : 'No visible donations found'} description={isFr ? 'Essayez d\'ajuster votre recherche ou vos filtres.' : 'Try adjusting your search or filters.'} />
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

        {/* Smart sections below main grid */}
        {!isSearching && <FeaturedSection />}
        {!isSearching && (
          <div className="mt-8">
            <ForYouFeed />
          </div>
        )}
        {!isSearching && user && <PersonalizedRecommendations />}
      </div>

      <ProductQuickView product={quickViewProduct} open={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />

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
