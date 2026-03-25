import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getProductPriceLabel } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const RV_KEY = 'sv_recently_viewed';
const MAX_ITEMS = 12;

/** Track a product view in localStorage */
export function trackProductView(productId: string) {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(RV_KEY) || '[]');
    const updated = [productId, ...ids.filter(id => id !== productId)].slice(0, MAX_ITEMS);
    localStorage.setItem(RV_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

function getRecentIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RV_KEY) || '[]');
  } catch { return []; }
}

export function RecentlyViewedProducts() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const recentIds = getRecentIds();

  const { data: products } = useQuery({
    queryKey: ['recently-viewed', recentIds.slice(0, 8).join(',')],
    queryFn: async () => {
      if (recentIds.length === 0) return [];
      const { data } = await db
        .from('digital_products')
        .select('id, title, cover_image_url, price, is_free, currency, slug, organization_id, organizations(slug, name)')
        .in('id', recentIds.slice(0, 8))
        .eq('is_published', true);
      if (!data) return [];
      // Maintain order from recentIds
      const map = new Map(data.map((p: any) => [p.id, p]));
      return recentIds.map(id => map.get(id)).filter(Boolean);
    },
    enabled: recentIds.length > 0,
    staleTime: 60_000,
  });

  if (!products || products.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {isFr ? 'Vus récemment' : 'Recently viewed'}
        </h3>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {products.map((p: any) => {
            const orgSlug = p.organizations?.slug || '';
            const path = p.slug ? `/org/${orgSlug}/p/${p.slug}` : `/org/${orgSlug}/product/${p.id}`;
            return (
              <button
                key={p.id}
                onClick={() => navigate(path)}
                className="shrink-0 w-36 group text-left"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted/50 border border-border group-hover:border-primary/30 transition-colors">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-3xl">📦</div>
                  )}
                </div>
                <p className="text-xs font-medium mt-1.5 line-clamp-1">{p.title}</p>
                <p className={cn('text-[10px]', (p as any).is_pwyw ? 'text-amber-600 font-medium' : 'text-muted-foreground')}>
                  {getProductPriceLabel(p as any, locale).text}
                </p>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.div>
  );
}
