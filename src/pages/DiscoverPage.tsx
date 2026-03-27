import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, Loader2, SlidersHorizontal } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

import { DiscoverCTABanner } from '@/components/discover/DiscoverCTABanner';
import { FeaturedSection } from '@/components/discover/FeaturedSection';
import { PersonalizedRecommendations } from '@/components/discover/PersonalizedRecommendations';
import { ForYouFeed } from '@/components/discover/ForYouFeed';
import { CategoryCarousels } from '@/components/discover/CategoryCarousels';
import { useCallback, useRef, useEffect } from 'react';

import { SearchSuggestions, addRecentSearch } from '@/components/discover/SearchSuggestions';
import { ProductQuickView } from '@/components/products/ProductQuickView';
import { RecentlyViewedProducts } from '@/components/discover/RecentlyViewedProducts';
import { StickyFilterBar } from '@/components/discover/StickyFilterBar';
import { NotificationDigest } from '@/components/notifications/NotificationDigest';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

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
  const [sortBy, setSortBy] = useState<ProductSort>('mixed');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('');
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const debouncedSearch = useDebounce(search, 300);
  const isFr = locale === 'fr';

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
    staleTime: 2 * 60 * 1000,
  });
  const products = productsQuery.data?.pages.flatMap(p => p.items) || [];

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
  const isLoading = productsQuery.isLoading;

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

      <div className="container max-w-6xl px-4 py-6">
        {/* Contextual banners */}
        {!isSearching && user && <NotificationDigest />}
        {!isSearching && !user && <DiscoverCTABanner />}
        {!isSearching && <RecentlyViewedProducts />}

        {/* Category browsing carousel (includes campaigns & donations tabs) */}
        {!isSearching && <CategoryCarousels />}

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
    </div>
  );
}
