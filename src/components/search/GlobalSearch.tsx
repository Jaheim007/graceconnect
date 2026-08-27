import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, X, Building2, ShoppingBag, CalendarDays, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';

interface SearchResult {
  id: string;
  type: 'org' | 'product' | 'event' | 'media';
  title: string;
  subtitle?: string;
  url: string;
  image?: string;
  price?: number;
  currency?: string;
}

type FilterType = 'all' | 'org' | 'product' | 'event' | 'media';

const ICONS = {
  org: Building2,
  product: ShoppingBag,
  event: CalendarDays,
  media: Play,
};

const getLabels = (isFr: boolean): Record<FilterType, string> => ({
  all: isFr ? 'Tout' : 'All',
  org: isFr ? 'Plateformes' : 'Platforms',
  product: isFr ? 'Produits' : 'Products',
  event: isFr ? 'Événements' : 'Events',
  media: isFr ? 'Médias' : 'Media',
});

const TAB_COLORS: Record<FilterType, string> = {
  all: 'bg-primary/10 text-primary',
  org: 'bg-blue-500/10 text-blue-500',
  product: 'bg-amber-500/10 text-amber-500',
  event: 'bg-green-500/10 text-green-500',
  media: 'bg-violet-500/10 text-violet-500',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);
  const { locale } = useI18n();
  const { fmt } = useDisplayCurrency();

  const isFr = locale === 'fr';
  const labels = getLabels(isFr);
  const dateLocale = isFr ? 'fr-FR' : 'en-US';

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const tsQuery = debouncedQuery.split(/\s+/).filter(Boolean).join(' & ');
      const all: SearchResult[] = [];

      const [orgs, products, events, media] = await Promise.all([
        db.from('organizations').select('id, name, slug, logo_url, description')
          .eq('is_active', true).textSearch('fts_vector', tsQuery).limit(8),
        db.from('digital_products').select('id, title, cover_image_url, price, currency, organization_id, organizations(slug)')
          .eq('is_published', true).textSearch('fts_vector', tsQuery).limit(8),
        db.from('events').select('id, title, location, event_date, organization_id, organizations(slug)')
          .eq('is_published', true).textSearch('fts_vector', tsQuery).limit(8),
        db.from('media_content').select('id, title, media_type, thumbnail_url, organization_id, organizations(slug)')
          .eq('is_published', true).textSearch('fts_vector', tsQuery).limit(8),
      ]);

      (orgs.data || []).forEach((o: any) => all.push({
        id: o.id, type: 'org', title: o.name, subtitle: o.description?.slice(0, 60),
        url: `/org/${o.slug}`, image: o.logo_url,
      }));
      (products.data || []).forEach((p: any) => all.push({
        id: p.id, type: 'product', title: p.title, price: p.price, currency: p.currency,
        url: `/org/${p.organizations?.slug}?tab=store`, image: p.cover_image_url,
      }));
      (events.data || []).forEach((e: any) => all.push({
        id: e.id,
        type: 'event',
        title: e.title,
        subtitle: e.location || (e.event_date ? new Date(e.event_date).toLocaleDateString(dateLocale) : undefined),
        url: `/org/${e.organizations?.slug}?tab=events`,
      }));
      (media.data || []).forEach((m: any) => all.push({
        id: m.id, type: 'media', title: m.title, subtitle: m.media_type,
        url: m.media_type === 'reel' ? `/reels/${m.id}` : `/watch/${m.id}`,
        image: m.thumbnail_url,
      }));

      return all;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const filtered = filter === 'all' ? results : results.filter(r => r.type === filter);

  const counts: Record<FilterType, number> = { all: results.length, org: 0, product: 0, event: 0, media: 0 };
  results.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSelect = (url: string) => {
    navigate(url);
    setOpen(false);
    setQuery('');
    setFilter('all');
  };

  if (!open) {
    return (
      <button data-tour="search"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border/60 bg-card/60 hover:bg-card text-xs text-muted-foreground transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isFr ? 'Rechercher...' : 'Search...'}</span>
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" onClick={() => setOpen(false)} />

      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-[12vh]">
        <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-elevated overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setFilter('all'); }}
              placeholder={isFr ? 'Rechercher plateformes, produits, événements...' : 'Search platforms, products, events...'}
              className="border-0 h-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
            <button onClick={() => setOpen(false)} className="shrink-0 p-1 rounded hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Category tabs */}
          {results.length > 0 && (
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/50 overflow-x-auto scrollbar-hide">
              {(['all', 'org', 'product', 'event', 'media'] as FilterType[]).map(tab => (
                counts[tab] > 0 && (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={cn(
                      'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                      filter === tab ? TAB_COLORS[tab] : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {labels[tab]} {counts[tab] > 0 && <span className="ml-0.5 opacity-60">{counts[tab]}</span>}
                  </button>
                )
              ))}
            </div>
          )}

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-6 text-center space-y-2">
                <Search className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground">{isFr ? 'Tapez au moins 2 caractères pour rechercher' : 'Type at least 2 characters to search'}</p>
                <p className="text-[10px] text-muted-foreground/60">{isFr ? 'Astuce : ⌘K pour ouvrir la recherche' : 'Tip: ⌘K to open search'}</p>
              </div>
            ) : isLoading ? (
              <div className="p-6 text-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">{isFr ? 'Recherche en cours...' : 'Searching...'}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {isFr ? `Aucun résultat pour « ${query} »` : `No result for “${query}”`}
                {filter !== 'all' ? (isFr ? ` dans ${labels[filter]}` : ` in ${labels[filter]}`) : ''}
              </div>
            ) : (
              <div className="py-1.5">
                {filtered.map((r) => {
                  const Icon = ICONS[r.type];
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSelect(r.url)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                    >
                      {r.image ? (
                        <img src={r.image} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <Badge variant="outline" className={cn('text-[9px] border-0 capitalize', TAB_COLORS[r.type])}>
                          {labels[r.type].replace(/s$/, '')}
                        </Badge>
                        {r.type === 'product' && r.price !== undefined && (
                          <span className="text-[10px] font-semibold text-primary">
                            {r.price === 0 ? (isFr ? 'Gratuit' : 'Free') : fmt(r.price, r.currency)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
