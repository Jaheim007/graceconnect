import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, Loader2, Flame } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useBuyerWorld } from '@/hooks/useBuyerWorld';

const FeaturedSection = lazy(() => import('@/components/discover/FeaturedSection').then(m => ({ default: m.FeaturedSection })));
const ForYouFeed = lazy(() => import('@/components/discover/ForYouFeed').then(m => ({ default: m.ForYouFeed })));
const CategoryCarousels = lazy(() => import('@/components/discover/CategoryCarousels').then(m => ({ default: m.CategoryCarousels })));
const RecentlyViewedProducts = lazy(() => import('@/components/discover/RecentlyViewedProducts').then(m => ({ default: m.RecentlyViewedProducts })));
const ExploreSearchResults = lazy(() => import('@/components/discover/ExploreSearchResults').then(m => ({ default: m.ExploreSearchResults })));
import { SearchSuggestions, addRecentSearch } from '@/components/discover/SearchSuggestions';
import { BUYER_WORLDS, SERVICE_WORLDS, normalizeBuyerWorld, type BuyerWorld } from '@/lib/siteviral/buyerWorlds';
import { showServiceSurfaces } from '@/lib/siteviral/visibility';

// Per-world discover experiences — each vertical has its own real listing surface.
// Church is intentionally NOT wired here: it is a separate platform (not a service
// people browse for on the marketplace).
const BeautySearch = lazy(() => import('@/pages/beauty/BeautySearch'));
const HomeDiscover = lazy(() => import('@/pages/home/HomeDiscover'));
const EventsDiscover = lazy(() => import('@/pages/events/EventsDiscover'));
const EducationDiscover = lazy(() => import('@/pages/education/EducationDiscover'));

const WORLD_COMPONENT: Partial<Record<BuyerWorld, React.LazyExoticComponent<React.ComponentType<any>>>> = {
  beauty: BeautySearch,
  home: HomeDiscover,
  events: EventsDiscover,
  education: EducationDiscover,
};

/**
 * Explore page that lives INSIDE the authenticated dashboard shell (AppLayout).
 * Accepts a `?world=<x>` filter so buyers land here with their category
 * pre-selected instead of being pushed to a standalone marketing page.
 */
export default function DashboardExplorePage() {
  const [params, setParams] = useSearchParams();
  const world = normalizeBuyerWorld(params.get('world'));
  const worldMeta = world ? BUYER_WORLDS[world] : null;
  const { setBuyerWorld } = useBuyerWorld();

  const { locale, t } = useI18n();
  const fr = locale === 'fr';

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const isSearching = debouncedSearch.length > 0;

  // (D) Persist buyer world when URL sets it, so sidebar/URL stay in sync.
  useEffect(() => {
    if (world) {
      void setBuyerWorld(world);
      try { localStorage.setItem('sv_last_vertical', world); } catch {}
    }
  }, [world, setBuyerWorld]);

  const clearWorld = () => {
    const next = new URLSearchParams(params);
    next.delete('world');
    setParams(next, { replace: true });
  };

  const WorldComponent = world ? WORLD_COMPONENT[world] : undefined;

  const title = useMemo(() => {
    if (worldMeta) return fr ? `Explorer — ${worldMeta.labelFr}` : `Explore — ${worldMeta.labelEn}`;
    return t('discover.title');
  }, [worldMeta, fr, t]);

  return (
    <div className="bg-background native-page-screen">
      <SEOHead title={title} description={t('discover.seo_desc')} />

      <div className="relative overflow-hidden border-b border-border py-8 px-4">
        {/* Ambient "fire" glow — bold, alive header */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[90px]" />
          <div className="absolute -bottom-28 left-[12%] h-56 w-56 rounded-full bg-orange-500/20 blur-[80px]" />
          <div className="absolute -top-10 right-[8%] h-52 w-52 rounded-full bg-fuchsia-500/20 blur-[80px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="container max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Flame className="h-3.5 w-3.5" />
            {fr ? 'Ça bouge en ce moment' : 'Hot right now'}
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              {title}
            </span>
          </h1>

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
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">{t('discover.subtitle')}</p>
          )}


          <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-primary/60 via-orange-500/50 to-fuchsia-500/50 shadow-[0_18px_50px_-24px_hsl(var(--primary)/0.55)]">
            <div className="relative rounded-[calc(1rem-1px)] bg-card">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder={t('discover.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' && search.trim()) { addRecentSearch(search.trim()); setSearchFocused(false); } }}
                className="pl-11 h-12 sm:h-14 rounded-2xl border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
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


          {/* World chip row — services only (Church has its own platform) */}
          {showServiceSurfaces() && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {SERVICE_WORLDS.map((w) => {
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
          )}

        </div>
      </div>

      {isSearching ? (
        <div className="container max-w-6xl px-4 py-6">
          <Suspense fallback={
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          }>
            <ExploreSearchResults query={debouncedSearch} />
          </Suspense>
        </div>
      ) : WorldComponent ? (
        <div className="container max-w-6xl px-4 py-6">
          <Suspense fallback={
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          }>
            <WorldComponent />
          </Suspense>
        </div>
      ) : (
        <div className="container max-w-6xl px-4 py-6 space-y-8">
          <InterestHub />
          <Suspense fallback={null}>
            <RecentlyViewedProducts />
            <CategoryCarousels />
            <FeaturedSection />
            <div>
              <ForYouFeed />
            </div>
          </Suspense>
        </div>
      )}

    </div>
  );
}

/**
 * "For you" hub built from the interests the user picked in /looking-for.
 * Each interest becomes a big card that jumps into that world's real listing.
 * This is what makes Explorer feel like a mix of *your* interests — not a
 * digital-products-only wall.
 */
function InterestHub() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const interests = useMemo<BuyerWorld[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('sv_interests') : null;
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return arr
        .map((k) => normalizeBuyerWorld(k))
        .filter((k): k is BuyerWorld => !!k && k !== 'church');
    } catch { return []; }
  }, []);

  if (!showServiceSurfaces() || interests.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {fr ? 'Pour vous' : 'For you'}
        </h2>
        <Link to="/looking-for" className="text-xs text-primary font-medium hover:underline">
          {fr ? 'Modifier' : 'Edit'}
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {interests.map((w) => {
          const meta = BUYER_WORLDS[w];
          return (
            <Link
              key={w}
              to={`/dashboard/explore?world=${w}`}
              className="group rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-2xl shrink-0">
                <span>{meta.emoji}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">
                  {fr ? meta.labelFr : meta.labelEn}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {fr ? 'Voir les meilleurs profils' : 'Browse top providers'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

