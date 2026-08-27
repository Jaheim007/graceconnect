import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Flame, BookOpen, Star, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';

export function TrendingProducts({ limit = 6 }: { limit?: number }) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmtPrice } = useDisplayCurrency();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['trending-products', limit],
    queryFn: async () => {
      const { data } = await db.from('digital_products')
        .select('id, title, cover_image_url, price, currency, is_free, slug, sales_count, average_rating, review_count, product_type, content_language, organizations!inner(slug, name, logo_url)')
        .eq('is_published', true)
        .gt('sales_count', 0)
        .order('sales_count', { ascending: false })
        .limit(limit);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-36 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold flex items-center gap-1.5">
          <Flame className="h-4.5 w-4.5 text-orange-500" /> {isFr ? 'En tendance' : 'Trending'}
        </h2>
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/discover')}>
          {isFr ? 'Tout voir' : 'See all'} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((product: any, i: number) => {
          const org = product.organizations;
          const langFlag = product.content_language === 'en' ? '🇬🇧' : product.content_language === 'fr' ? '🇫🇷' : null;
          return (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/org/${org?.slug}/${product.slug || product.id}`)}
              className="text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all group"
            >
              <div className="aspect-[3/2] bg-muted/30 relative overflow-hidden">
                {product.cover_image_url ? (
                  <img src={product.cover_image_url} alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}
                {product.sales_count >= 10 && (
                  <Badge className="absolute top-2 left-2 text-[9px] bg-orange-500 text-white border-0">
                    🔥 {product.sales_count} {isFr ? 'ventes' : 'sales'}
                  </Badge>
                )}
                {langFlag && (
                  <Badge className="absolute top-2 right-2 text-[9px] bg-background/80 backdrop-blur-xs text-foreground border-0">
                    {langFlag}
                  </Badge>
                )}
              </div>

              <div className="p-3 space-y-1.5">
                <p className="text-xs font-bold line-clamp-2 leading-tight">{product.title}</p>
                <div className="flex items-center gap-1.5">
                  {org?.logo_url && <img src={org.logo_url} alt="" className="h-3.5 w-3.5 rounded-full" />}
                  <p className="text-[10px] text-muted-foreground truncate">{org?.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-primary">
                    {fmtPrice(product.price || 0, product.is_free, product.currency)}
                  </p>
                  {product.average_rating > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px] text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      {product.average_rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
