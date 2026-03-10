import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, Loader2, Filter, SlidersHorizontal } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { OfferingCard } from '@/components/offerings/OfferingCard';
import { OfferingModal } from '@/components/offerings/OfferingModal';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

import { DiscoverCTABanner } from '@/components/discover/DiscoverCTABanner';
import { FeaturedSection } from '@/components/discover/FeaturedSection';
import { PersonalizedRecommendations } from '@/components/discover/PersonalizedRecommendations';
import { ForYouFeed } from '@/components/discover/ForYouFeed';
import { CategoryCarousels } from '@/components/discover/CategoryCarousels';
import { useCallback, useRef, useEffect } from 'react';

import { Offering } from '@/hooks/useOfferings';
import { SearchSuggestions, addRecentSearch } from '@/components/discover/SearchSuggestions';
import { ProductQuickView } from '@/components/products/ProductQuickView';
import { RecentlyViewedProducts } from '@/components/discover/RecentlyViewedProducts';
import { StickyFilterBar } from '@/components/discover/StickyFilterBar';
import { NotificationDigest } from '@/components/notifications/NotificationDigest';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

type ContentFilter = 'all' | 'products' | 'campaigns' | 'offerings';
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
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [sortBy, setSortBy] = useState<ProductSort>('mixed');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('');
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const debouncedSearch = useDebounce(search, 300);
  const isFr = locale === 'fr';

  const showProducts = contentFilter === 'all' || contentFilter === 'products';
  const showCampaigns = contentFilter === 'all' || contentFilter === 'campaigns';
  const showOfferings = contentFilter === 'all' || contentFilter === 'offerings';

  // Products query
  const productsQuery = useInfiniteQuery({
    queryKey: ['discover-products', debouncedSearch, sortBy, priceFilter, typeFilter],
    queryFn: async ({ pageParam = 0 }) => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
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
        _type: 'product' as const,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
        org_kyc_status: p.organizations?.kyc_status,
        org_category: p.organizations?.category,
      }));
      return { items: sortBy === 'mixed' ? mixByOrg(mapped) : mapped, page: pageParam };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.items.length < PAGE_SIZE) return undefined;
      return lastPage.page + 1;
    },
    initialPageParam: 0,
    enabled: showProducts,
    staleTime: 2 * 60 * 1000,
  });
  const products = productsQuery.data?.pages.flatMap(p => p.items) || [];

  // Campaigns query (first page only in unified feed, unless filtered)
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['discover-campaigns-unified', debouncedSearch],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_active', true)
        .eq('is_express_demo', false)
        .order('current_amount', { ascending: false })
        .limit(contentFilter === 'campaigns' ? 50 : 6);
      if (debouncedSearch) q = q.ilike('title', `%${debouncedSearch}%`);
      const { data } = await q;
      return (data || []).map((c: any) => ({
        ...c,
        _type: 'campaign' as const,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
        is_org_verified: c.organizations?.is_verified,
        org_kyc_status: c.organizations?.kyc_status,
        org_category: c.organizations?.category,
      }));
    },
    enabled: showCampaigns,
    staleTime: 2 * 60 * 1000,
  });

  // Offerings query
  const { data: offerings = [], isLoading: loadingOfferings } = useQuery({
    queryKey: ['discover-offerings-unified', debouncedSearch],
    queryFn: async () => {
      let q = db
        .from('offerings')
        .select('*, organizations!inner(name, slug, logo_url, currency, offerings_enabled, is_verified, kyc_status, category)')
        .eq('is_active', true)
        .eq('organizations.offerings_enabled', true)
        .order('created_at', { ascending: false })
        .limit(contentFilter === 'offerings' ? 50 : 4);
      if (debouncedSearch) q = q.ilike('title', `%${debouncedSearch}%`);
      const { data } = await q;
      return (data || []).map((o: any) => ({
        ...o,
        _type: 'offering' as const,
        organization_name: o.organizations?.name,
        organization_slug: o.organizations?.slug,
        is_org_verified: o.organizations?.is_verified,
        org_kyc_status: o.organizations?.kyc_status,
        org_category: o.organizations?.category,
      }));
    },
    enabled: showOfferings,
    staleTime: 2 * 60 * 1000,
  });

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

  const isSearching = debouncedSearch.length > 0;
  const isLoading = productsQuery.isLoading || (showCampaigns && loadingCampaigns) || (showOfferings && loadingOfferings);

  const CONTENT_FILTERS: { value: ContentFilter; label: string; count: number }[] = [
    { value: 'all', label: isFr ? 'Tout' : 'All', count: products.length + campaigns.length + offerings.length },
    { value: 'products', label: isFr ? 'Ressources' : 'Resources', count: products.length },
    { value: 'campaigns', label: isFr ? 'Campagnes' : 'Campaigns', count: campaigns.length },
    { value: 'offerings', label: isFr ? 'Dons' : 'Donations', count: offerings.length },
  ];

  return (
    <div className="bg-background min-h-screen">
      <SEOHead title={t('discover.seo_title')} description={t('discover.seo_desc')} />

      {/* Header with search */}
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
        {/* Contextual banners */}
        {!isSearching && user && <NotificationDigest />}
        {!isSearching && !user && <DiscoverCTABanner />}
        {!isSearching && <RecentlyViewedProducts />}

        {/* Category browsing carousel */}
        {!isSearching && <CategoryCarousels />}

        {/* Unified content filter pills + filter toggle */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {CONTENT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setContentFilter(f.value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border',
                  contentFilter === f.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {showProducts && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs ml-auto h-8"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {isFr ? 'Filtres' : 'Filters'}
            </Button>
          )}
        </div>

        {/* Product filters (collapsible) */}
        {showFilters && showProducts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <StickyFilterBar
              sortBy={sortBy}
              setSortBy={setSortBy}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
            />
          </motion.div>
        )}

        {/* Loading */}
        {isLoading ? <SkeletonList count={8} /> : (
          <>
            {/* Campaigns section (if showing) */}
            {showCampaigns && campaigns.length > 0 && (
              <div className="mb-8">
                {contentFilter === 'all' && (
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      ❤️ {isFr ? 'Campagnes actives' : 'Active campaigns'}
                    </h2>
                    <button
                      onClick={() => setContentFilter('campaigns')}
                      className="text-xs text-primary hover:underline"
                    >
                      {isFr ? 'Voir tout' : 'See all'} →
                    </button>
                  </div>
                )}
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((c: any) => (
                    <motion.div key={c.id} variants={fadeUp}>
                      <CampaignCard campaign={c} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Offerings section (if showing) */}
            {showOfferings && offerings.length > 0 && (
              <div className="mb-8">
                {contentFilter === 'all' && (
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      🤲 {isFr ? 'Dons & offrandes' : 'Donations & offerings'}
                    </h2>
                    <button
                      onClick={() => setContentFilter('offerings')}
                      className="text-xs text-primary hover:underline"
                    >
                      {isFr ? 'Voir tout' : 'See all'} →
                    </button>
                  </div>
                )}
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {offerings.map((o: any) => (
                    <motion.div key={o.id} variants={fadeUp}>
                      <div className="relative">
                        {o.organization_name && (
                          <button onClick={() => navigate(`/org/${o.organization_slug}`)} className="text-[10px] text-muted-foreground hover:text-primary mb-1 flex items-center gap-1">{o.organization_name} {o.is_org_verified && <VerifiedBadge size="xs" showTooltip={false} />}</button>
                        )}
                        <OfferingCard offering={o} onSelect={setSelectedOffering} />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Products — main feed */}
            {showProducts && (
              <div>
                {contentFilter === 'all' && products.length > 0 && (
                  <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                    📦 {isFr ? 'Ressources numériques' : 'Digital resources'}
                  </h2>
                )}
                {products.length === 0 && !productsQuery.isLoading ? (
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
              </div>
            )}

            {/* Empty state for non-product filters */}
            {contentFilter === 'campaigns' && campaigns.length === 0 && !loadingCampaigns && (
              <EmptyState variant="search" title={isFr ? 'Aucune campagne trouvée' : 'No campaigns found'} />
            )}
            {contentFilter === 'offerings' && offerings.length === 0 && !loadingOfferings && (
              <EmptyState variant="generic" title={isFr ? 'Aucun don trouvé' : 'No donations found'} />
            )}
          </>
        )}

        {/* Below-fold smart sections */}
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
