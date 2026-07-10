import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { useDebounce } from '@/hooks/useDebounce';

import { FeaturedSection } from '@/components/discover/FeaturedSection';
import { ForYouFeed } from '@/components/discover/ForYouFeed';
import { CategoryCarousels } from '@/components/discover/CategoryCarousels';
import { SearchSuggestions, addRecentSearch } from '@/components/discover/SearchSuggestions';
import { RecentlyViewedProducts } from '@/components/discover/RecentlyViewedProducts';
import { BUYER_WORLDS, normalizeBuyerWorld, type BuyerWorld } from '@/lib/siteviral/buyerWorlds';

/**
 * Explore page that lives INSIDE the authenticated dashboard shell (AppLayout).
 * Accepts a `?world=<x>` filter so buyers land here with their category
 * pre-selected instead of being pushed to a standalone marketing page.
 */
export default function DashboardExplorePage() {
  const [params, setParams] = useSearchParams();
  const world = normalizeBuyerWorld(params.get('world'));
  const worldMeta = world ? BUYER_WORLDS[world] : null;

  const { locale, t } = useI18n();
  const fr = locale === 'fr';

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const isSearching = debouncedSearch.length > 0;

  const clearWorld = () => {
    const next = new URLSearchParams(params);
    next.delete('world');
    setParams(next, { replace: true });
  };

  const title = useMemo(() => {
    if (worldMeta) return fr ? `Explorer — ${worldMeta.labelFr}` : `Explore — ${worldMeta.labelEn}`;
    return t('discover.title');
  }, [worldMeta, fr, t]);

  return (
    <div className="bg-background native-page-screen">
      <SEOHead title={title} description={t('discover.seo_desc')} />

      <div className="border-b border-border py-5 px-4">
        <div className="container max-w-4xl space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>

          {worldMeta ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 py-1 pl-2 pr-1">
                <span>{worldMeta.emoji}</span>
                <span className="text-xs">{fr ? worldMeta.labelFr : worldMeta.labelEn}</span>
                <button
                  onClick={clearWorld}
                  className="ml-1 rounded-full p-0.5 hover:bg-background"
                  aria-label={fr ? 'Retirer le filtre' : 'Remove filter'}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {fr ? 'Filtré par univers' : 'Filtered by world'}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('discover.subtitle')}</p>
          )}

          <div className="relative">
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

          {/* World chip row — quick switch */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {(Object.keys(BUYER_WORLDS) as BuyerWorld[]).map((w) => {
              const meta = BUYER_WORLDS[w];
              const active = world === w;
              return (
                <Link
                  key={w}
                  to={`/dashboard/explore?world=${w}`}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="mr-1">{meta.emoji}</span>
                  {fr ? meta.labelFr : meta.labelEn}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container max-w-6xl px-4 py-6">
        {!isSearching && <RecentlyViewedProducts />}
        {!isSearching && <CategoryCarousels />}
        {!isSearching && <FeaturedSection />}
        {!isSearching && (
          <div className="mt-8">
            <ForYouFeed />
          </div>
        )}
      </div>
    </div>
  );
}
