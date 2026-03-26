import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, TrendingUp, Flame, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAffiliateMarketplace } from '@/hooks/useAffiliateMarketplace';
import { ProductSwipeCard } from './ProductSwipeCard';
import { cn } from '@/lib/utils';
import { CategoryFilter, ProductCategory, categorizeProduct } from './CategoryFilter';

type SortMode = 'trending' | 'commission' | 'price' | 'newest';

export function SwipeableFeed() {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [category, setCategory] = useState<ProductCategory>('all');
  const { data: products, isLoading } = useAffiliateMarketplace(search || undefined);

  // Filter by category then sort
  const filteredProducts = (products || []).filter((p: any) => {
    if (category === 'all') return true;
    return categorizeProduct(p.title, p.description) === category;
  });

  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    if (sortMode === 'commission') {
      const cA = a.organizations?.affiliation_commission_percent || 10;
      const cB = b.organizations?.affiliation_commission_percent || 10;
      return cB - cA;
    }
    if (sortMode === 'price') {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortMode === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    // trending = by sales_count (default)
    return (b.sales_count || 0) - (a.sales_count || 0);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Produits à partager
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choisis un produit, partage-le, gagne une commission. C'est tout.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Category filter */}
        <CategoryFilter selected={category} onChange={setCategory} />

        {/* Sort pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {[
            { key: 'trending' as SortMode, label: '🔥 Tendances', icon: Flame },
            { key: 'newest' as SortMode, label: '🆕 Nouveaux', icon: TrendingUp },
            { key: 'commission' as SortMode, label: '💰 Meilleures commissions', icon: DollarSign },
            { key: 'price' as SortMode, label: '💎 Plus chers', icon: TrendingUp },
          ].map(s => (
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
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-3xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : !sortedProducts.length ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="space-y-5 snap-y">
          {sortedProducts.map((product: any, i: number) => (
            <ProductSwipeCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
