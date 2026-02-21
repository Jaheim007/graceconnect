import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, X, Building2, ShoppingBag, CalendarDays, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'org' | 'product' | 'event' | 'media';
  title: string;
  subtitle?: string;
  url: string;
  image?: string;
}

const ICONS = {
  org: Building2,
  product: ShoppingBag,
  event: CalendarDays,
  media: Play,
};

const LABELS = {
  org: 'Organisation',
  product: 'Produit',
  event: 'Événement',
  media: 'Média',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: results = [] } = useQuery<SearchResult[]>({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const tsQuery = query.split(/\s+/).filter(Boolean).join(' & ');
      const all: SearchResult[] = [];

      const [orgs, products, events, media] = await Promise.all([
        db.from('organizations').select('id, name, slug, logo_url, description')
          .eq('is_active', true).textSearch('fts_vector', tsQuery).limit(5),
        db.from('digital_products').select('id, title, cover_image_url, organization_id, organizations(slug)')
          .eq('is_published', true).textSearch('fts_vector', tsQuery).limit(5),
        db.from('events').select('id, title, location, organization_id, organizations(slug)')
          .eq('is_published', true).textSearch('fts_vector', tsQuery).limit(5),
        db.from('media_content').select('id, title, media_type, thumbnail_url, organization_id, organizations(slug)')
          .eq('is_published', true).textSearch('fts_vector', tsQuery).limit(5),
      ]);

      (orgs.data || []).forEach((o: any) => all.push({
        id: o.id, type: 'org', title: o.name, subtitle: o.description?.slice(0, 60),
        url: `/org/${o.slug}`, image: o.logo_url,
      }));
      (products.data || []).forEach((p: any) => all.push({
        id: p.id, type: 'product', title: p.title,
        url: `/org/${p.organizations?.slug}?tab=store`, image: p.cover_image_url,
      }));
      (events.data || []).forEach((e: any) => all.push({
        id: e.id, type: 'event', title: e.title, subtitle: e.location,
        url: `/org/${e.organizations?.slug}?tab=events`,
      }));
      (media.data || []).forEach((m: any) => all.push({
        id: m.id, type: 'media', title: m.title, subtitle: m.media_type,
        url: m.media_type === 'reel' ? `/reels/${m.id}` : `/watch/${m.id}`,
        image: m.thumbnail_url,
      }));

      return all;
    },
    enabled: query.length >= 2,
  });

  // Close on escape
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
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border/60 bg-card/60 hover:bg-card text-xs text-muted-foreground transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Search panel */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-[15vh]">
        <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-elevated overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher organisations, produits, événements..."
              className="border-0 h-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
            <button onClick={() => setOpen(false)} className="shrink-0 p-1 rounded hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Tapez au moins 2 caractères pour rechercher
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Aucun résultat pour « {query} »
              </div>
            ) : (
              <div className="py-2">
                {results.map((r) => {
                  const Icon = ICONS[r.type];
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSelect(r.url)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                    >
                      {r.image ? (
                        <img src={r.image} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase shrink-0">{LABELS[r.type]}</span>
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
