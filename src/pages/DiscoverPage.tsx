import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, X } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';

import { FeaturedSection } from '@/components/discover/FeaturedSection';
import { ForYouFeed } from '@/components/discover/ForYouFeed';
import { CategoryCarousels } from '@/components/discover/CategoryCarousels';
import { CategoryRail, type CategoryValue } from '@/components/discover/CategoryRail';
import { SearchSuggestions, addRecentSearch } from '@/components/discover/SearchSuggestions';
import { RecentlyViewedProducts } from '@/components/discover/RecentlyViewedProducts';
import { BuyerCreatorBanner } from '@/components/discover/BuyerCreatorBanner';
import { JustLaunchedSection } from '@/components/discover/JustLaunchedSection';

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState<CategoryValue>('');
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const fr = locale === 'fr';
  const debouncedSearch = useDebounce(search, 300);

  const isSearching = debouncedSearch.length > 0;

  return (
    <AdaptiveLayout>
    <div className="bg-background native-page-screen">
      <SEOHead title={t('discover.seo_title')} description={t('discover.seo_desc')} />

      {/* Header — search and filters live together, as one control surface */}
      <div className="relative border-b border-border/70 px-4 py-8 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-28 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[90px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="container max-w-5xl space-y-5">
          <div className="max-w-2xl">
            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
              {t('discover.title')}
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">{t('discover.subtitle')}</p>
          </div>

          <div className="relative z-50 max-w-2xl rounded-2xl p-[1.5px] bg-gradient-to-r from-primary/50 via-primary/25 to-fuchsia-500/35 shadow-[0_18px_50px_-30px_hsl(var(--primary)/0.6)]">
            <div className="relative rounded-[calc(1rem-1px)] bg-card">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder={t('discover.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' && search.trim()) { addRecentSearch(search.trim()); setSearchFocused(false); } }}
                className="h-12 rounded-2xl border-0 bg-transparent pl-11 pr-11 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label={fr ? 'Effacer' : 'Clear'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <SearchSuggestions
              query={search}
              isOpen={searchFocused}
              onSelect={(term) => { setSearch(term); addRecentSearch(term); setSearchFocused(false); }}
              onClose={() => setSearchFocused(false)}
            />
          </div>

          {/* Filters, right under the search — no longer buried below the feed */}
          {!isSearching && (
            <CategoryRail value={category} onChange={setCategory} layoutId="discover-cat-pill" />
          )}
        </div>
      </div>

      <div className="container max-w-6xl px-4 py-6">
        {/* Banner to convert buyers into creators */}
        {!isSearching && <BuyerCreatorBanner />}

        {/* Filtered catalogue — driven by the header rail */}
        {!isSearching && (
          <CategoryCarousels category={category} onCategoryChange={setCategory} hideRail />
        )}

        {/* Recently viewed — personal relevance */}
        {!isSearching && <RecentlyViewedProducts />}

        {/* Guaranteed placement for newly published products */}
        {!isSearching && <JustLaunchedSection />}

        {/* Featured picks */}
        {!isSearching && <FeaturedSection />}

        {/* Personalized feed */}
        {!isSearching && (
          <div className="mt-8">
            <ForYouFeed />
          </div>
        )}
      </div>
    </div>
    </AdaptiveLayout>
  );
}

