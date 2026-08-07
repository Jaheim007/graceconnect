import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, TrendingUp, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

interface SearchSuggestionsProps {
  query: string;
  isOpen: boolean;
  onSelect: (term: string) => void;
  onClose: () => void;
}

const RECENT_KEY = 'sv_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, MAX_RECENT);
  } catch { return []; }
}

export function addRecentSearch(term: string) {
  if (!term.trim()) return;
  const recent = getRecentSearches().filter(s => s !== term);
  recent.unshift(term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function SearchSuggestions({ query, isOpen, onSelect, onClose }: SearchSuggestionsProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const ref = useRef<HTMLDivElement>(null);
  const [recent] = useState(getRecentSearches);

  // Fetch trending/popular product titles
  const { data: trending } = useQuery({
    queryKey: ['search-trending'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('title')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('sales_count', { ascending: false })
        .limit(6);
      return (data || []).map((p: any) => p.title as string);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Live autocomplete
  const { data: suggestions } = useQuery({
    queryKey: ['search-autocomplete', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data } = await db
        .from('digital_products')
        .select('title')
        .eq('is_published', true)
        .ilike('title', `%${query}%`)
        .limit(5);
      return (data || []).map((p: any) => p.title as string);
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasQuery = query.length >= 2;
  const items = hasQuery ? (suggestions || []) : [];
  const showRecent = !hasQuery && recent.length > 0;
  const showTrending = !hasQuery && (trending || []).length > 0;

  if (!showRecent && !showTrending && items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto"
      >
        {/* Recent searches */}
        {showRecent && (
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 mb-2">
              <Clock className="h-3 w-3" /> {isFr ? 'Récent' : 'Recent'}
            </p>
            {recent.map((term) => (
              <button
                key={term}
                onClick={() => onSelect(term)}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{term}</span>
              </button>
            ))}
          </div>
        )}

        {/* Trending */}
        {showTrending && (
          <div className="p-3 border-t border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 mb-2">
              <TrendingUp className="h-3 w-3" /> {isFr ? 'Tendances' : 'Trending'}
            </p>
            {(trending || []).map((title) => (
              <button
                key={title}
                onClick={() => onSelect(title)}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Autocomplete results */}
        {hasQuery && items.length > 0 && (
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 mb-2">
              <Search className="h-3 w-3" /> {isFr ? 'Suggestions' : 'Suggestions'}
            </p>
            {items.map((title) => (
              <button
                key={title}
                onClick={() => onSelect(title)}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
