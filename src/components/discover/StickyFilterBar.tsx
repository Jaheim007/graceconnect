import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, SlidersHorizontal, Star, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ProductSort = 'mixed' | 'popular' | 'recent' | 'price_asc' | 'price_desc' | 'rating' | 'best_selling' | 'most_viewed';
type PriceFilter = 'all' | 'free' | 'paid';
type ProductTypeFilter = '' | 'pdf' | 'ebook' | 'audio' | 'video' | 'link' | 'bundle';

interface StickyFilterBarProps {
  sortBy: ProductSort;
  setSortBy: (v: ProductSort) => void;
  priceFilter: PriceFilter;
  setPriceFilter: (v: PriceFilter) => void;
  typeFilter: ProductTypeFilter;
  setTypeFilter: (v: ProductTypeFilter) => void;
}

export function StickyFilterBar({ sortBy, setSortBy, priceFilter, setPriceFilter, typeFilter, setTypeFilter }: StickyFilterBarProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const PRODUCT_TYPES = [
    { value: '', label: isFr ? 'Tous types' : 'All types' },
    { value: 'pdf', label: 'PDF' },
    { value: 'ebook', label: 'E-book' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Vidéo' },
    { value: 'link', label: isFr ? 'Lien' : 'Link' },
    { value: 'bundle', label: 'Bundle' },
  ];

  return (
    <>
      <div ref={sentinelRef} className="h-0" />
      <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 transition-all duration-200 ${isSticky ? 'sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-2 px-1 -mx-1 border-b border-border/50 shadow-sm' : ''}`}>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as ProductSort)}>
          <SelectTrigger className="h-8 w-auto min-w-[100px] sm:min-w-[130px] text-xs gap-1">
            <ArrowUpDown className="h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mixed">🔀 Mix</SelectItem>
            <SelectItem value="popular"><TrendingUp className="h-3 w-3 inline mr-1" />{isFr ? 'Populaires' : 'Popular'}</SelectItem>
            <SelectItem value="recent">{isFr ? 'Récents' : 'Recent'}</SelectItem>
            <SelectItem value="best_selling">{isFr ? 'Plus vendus' : 'Best selling'}</SelectItem>
            <SelectItem value="most_viewed">{isFr ? 'Plus consultés' : 'Most viewed'}</SelectItem>
            <SelectItem value="rating"><Star className="h-3 w-3 inline mr-1" />{isFr ? 'Mieux notés' : 'Top rated'}</SelectItem>
            <SelectItem value="price_asc">{isFr ? 'Prix ↑' : 'Price ↑'}</SelectItem>
            <SelectItem value="price_desc">{isFr ? 'Prix ↓' : 'Price ↓'}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {(['all', 'free', 'paid'] as PriceFilter[]).map((pf) => (
            <Button key={pf} size="sm" variant={priceFilter === pf ? 'default' : 'outline'} className="h-8 text-xs px-3" onClick={() => setPriceFilter(pf)}>
              {pf === 'all' ? (isFr ? 'Tous' : 'All') : pf === 'free' ? (isFr ? 'Gratuit' : 'Free') : (isFr ? 'Payant' : 'Paid')}
            </Button>
          ))}
        </div>

        <Select value={typeFilter || '_all'} onValueChange={(v) => setTypeFilter(v === '_all' ? '' : v as ProductTypeFilter)}>
          <SelectTrigger className="h-8 w-auto min-w-[90px] sm:min-w-[110px] text-xs gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_TYPES.map((pt) => (
              <SelectItem key={pt.value || '_all'} value={pt.value || '_all'}>{pt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
