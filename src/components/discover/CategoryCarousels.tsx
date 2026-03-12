import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/products/ProductCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

const CATEGORY_META = [
  { value: '', emoji: '✨' },
  { value: 'pdf', emoji: '📄' },
  { value: 'ebook', emoji: '📚' },
  { value: 'audio', emoji: '🎵' },
  { value: 'video', emoji: '🎬' },
  { value: 'course', emoji: '🎓' },
  { value: 'link', emoji: '🔗' },
] as const;

export function CategoryCarousels() {
  const [activeCategory, setActiveCategory] = useState('');
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const labels: Record<string, string> = {
    '': isFr ? 'Tout' : 'All',
    pdf: 'PDF',
    ebook: 'E-books',
    audio: isFr ? 'Audio' : 'Audio',
    video: isFr ? 'Vidéo' : 'Video',
    course: isFr ? 'Cours' : 'Courses',
    link: isFr ? 'Liens' : 'Links',
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['category-carousel', activeCategory],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified)')
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
        is_org_verified: p.organizations?.is_verified,
      }));
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-4 py-4">
      {/* Category pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2 px-1">
          {CATEGORY_META.map((cat) => (
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
              {cat.emoji} {labels[cat.value]}
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
          {isFr ? 'Aucun produit dans cette catégorie' : 'No product in this category'}
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
