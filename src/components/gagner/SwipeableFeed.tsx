import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Flame, DollarSign, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAffiliateMarketplace } from '@/hooks/useAffiliateMarketplace';
import { ProductSwipeCard } from './ProductSwipeCard';
import { cn } from '@/lib/utils';
import { CategoryFilter, ProductCategory, categorizeProduct } from './CategoryFilter';
import { diversifyFeed } from '@/lib/feed-diversity';
import { useI18n } from '@/i18n/I18nContext';

type SortMode = 'trending' | 'commission' | 'price' | 'newest';

export function SwipeableFeed() {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [category, setCategory] = useState<ProductCategory>('all');
  const { data: products, isLoading } = useAffiliateMarketplace(search || undefined);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Filter by category then sort
  const filteredProducts = (products || []).filter((p: any) => {
    if (category === 'all') return true;
    return categorizeProduct(p.title, p.description) === category;
  });

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts].sort((a: any, b: any) => {
      if (sortMode === 'commission') {
        const cA = a.commission_rate ?? a.organizations?.affiliation_commission_percent ?? 10;
        const cB = b.commission_rate ?? b.organizations?.affiliation_commission_percent ?? 10;
        return cB - cA;
      }
      if (sortMode === 'price') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortMode === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return 0;
    });

    if (sortMode === 'trending') {
      return diversifyFeed(sorted, { maxPerOrg: 4 });
    }
    return diversifyFeed(sorted, { maxPerOrg: 5 });
  }, [filteredProducts, sortMode]);

  const SORT_OPTIONS: { key: SortMode; labelFr: string; labelEn: string; emoji: string }[] = [
    { key: 'trending', labelFr: 'Tendances', labelEn: 'Trending', emoji: '🔥' },
    { key: 'newest', labelFr: 'Nouveaux', labelEn: 'New', emoji: '🆕' },
    { key: 'commission', labelFr: 'Top commissions', labelEn: 'Top commissions', emoji: '💰' },
    { key: 'price', labelFr: 'Premium', labelEn: 'Premium', emoji: '💎' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            {isFr ? 'Produits à partager' : 'Products to share'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isFr
              ? 'Choisis un produit, partage-le, gagne une commission. C\'est tout.'
              : 'Pick a product, share it, earn a commission. That\'s it.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isFr ? 'Rechercher un produit...' : 'Search a product...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Category filter */}
        <CategoryFilter selected={category} onChange={setCategory} />

        {/* Sort pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {SORT_OPTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSortMode(s.key)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                sortMode === s.key
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:border-border'
              )}
            >
              {s.emoji} {isFr ? s.labelFr : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : !sortedProducts.length ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            {isFr ? 'Aucun produit trouvé' : 'No products found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {sortedProducts.map((product: any, i: number) => (
            <ProductSwipeCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && sortedProducts.length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground">
          {sortedProducts.length} {isFr ? 'produits' : 'products'}
        </p>
      )}
    </div>
  );
}
