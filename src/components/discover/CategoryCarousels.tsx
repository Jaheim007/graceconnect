import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/products/ProductCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const CATEGORIES = [
  { value: '', label: '✨ Tout', emoji: '✨' },
  { value: 'pdf', label: '📄 PDF', emoji: '📄' },
  { value: 'ebook', label: '📚 E-books', emoji: '📚' },
  { value: 'audio', label: '🎵 Audio', emoji: '🎵' },
  { value: 'video', label: '🎬 Vidéo', emoji: '🎬' },
  { value: 'course', label: '🎓 Cours', emoji: '🎓' },
  { value: 'link', label: '🔗 Liens', emoji: '🔗' },
];

export function CategoryCarousels() {
  const [activeCategory, setActiveCategory] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['category-carousel', activeCategory],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('featured_score', { ascending: false })
        .order('sales_count', { ascending: false })
        .limit(12);

      if (activeCategory) {
        q = q.eq('product_type', activeCategory);
      }

      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
      }));
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-4 py-4">
      {/* Category pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border',
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Horizontal product carousel */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          Aucun produit dans cette catégorie
        </p>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 px-1">
            {products.map((p: any, i: number) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="shrink-0 w-[220px] sm:w-[260px]"
              >
                <ProductCard product={p} hideCommission hideShare />
              </motion.div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
