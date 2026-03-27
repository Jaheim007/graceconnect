import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';

import { DiscoverCTABanner } from '@/components/discover/DiscoverCTABanner';
import { FeaturedSection } from '@/components/discover/FeaturedSection';
import { PersonalizedRecommendations } from '@/components/discover/PersonalizedRecommendations';
import { ForYouFeed } from '@/components/discover/ForYouFeed';
import { CategoryCarousels } from '@/components/discover/CategoryCarousels';

import { SearchSuggestions, addRecentSearch } from '@/components/discover/SearchSuggestions';
import { RecentlyViewedProducts } from '@/components/discover/RecentlyViewedProducts';
import { NotificationDigest } from '@/components/notifications/NotificationDigest';

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();
  const debouncedSearch = useDebounce(search, 300);

  const isSearching = debouncedSearch.length > 0;

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
              onChange={(e) => setSearch(e.target.value)}
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
        {!isSearching && user && <NotificationDigest />}
        {!isSearching && !user && <DiscoverCTABanner />}
        {!isSearching && <RecentlyViewedProducts />}

        {/* Unified feed — categories, campaigns & donations all in one */}
        {!isSearching && <CategoryCarousels />}

        {!isSearching && <FeaturedSection />}
        {!isSearching && (
          <div className="mt-8">
            <ForYouFeed />
          </div>
        )}
        {!isSearching && user && <PersonalizedRecommendations />}
      </div>
    </div>
  );
}
