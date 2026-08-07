import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';

interface SmartRecommendationsProps {
  excludeProductId?: string;
  organizationId?: string;
  productType?: string;
  limit?: number;
  title?: string;
}

export function SmartRecommendations({
  excludeProductId,
  organizationId,
  productType,
  limit = 4,
  title,
}: SmartRecommendationsProps) {
  const navigate = useNavigate();
  const { fmtPrice } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const defaultTitle = title || (isFr ? 'Tu pourrais aussi aimer' : 'You might also like');

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['smart-recs', excludeProductId, organizationId, productType, limit],
    queryFn: async () => {
      if (organizationId) {
        const { data: orgProducts } = await db.from('digital_products')
          .select('id, title, cover_image_url, price, currency, is_free, slug, sales_count, product_type, organizations!inner(slug, name)')
          .eq('is_published', true)
          .eq('organization_id', organizationId)
          .neq('id', excludeProductId || '')
          .order('sales_count', { ascending: false })
          .limit(limit);
        if (orgProducts?.length) return orgProducts;
      }

      if (productType) {
        const { data: typeProducts } = await db.from('digital_products')
          .select('id, title, cover_image_url, price, currency, is_free, slug, sales_count, product_type, organizations!inner(slug, name)')
          .eq('is_published', true)
          .eq('product_type', productType)
          .neq('id', excludeProductId || '')
          .order('sales_count', { ascending: false })
          .limit(limit);
        if (typeProducts?.length) return typeProducts;
      }

      const { data: topProducts } = await db.from('digital_products')
        .select('id, title, cover_image_url, price, currency, is_free, slug, sales_count, product_type, organizations!inner(slug, name)')
        .eq('is_published', true)
        .neq('id', excludeProductId || '')
        .order('sales_count', { ascending: false })
        .limit(limit);

      return topProducts || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-40 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map(i => <div key={i} className="h-36 rounded-xl bg-muted/50 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!recommendations.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-sm font-extrabold">{defaultTitle}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((product: any, i: number) => {
          const org = product.organizations;
          return (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/org/${org?.slug}/${product.slug || product.id}`)}
              className="text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors group"
            >
              <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden">
                {product.cover_image_url ? (
                  <img
                    src={product.cover_image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📖</div>
                )}
                {product.sales_count > 5 && (
                  <Badge className="absolute top-1.5 right-1.5 text-[9px] bg-accent text-accent-foreground">
                    🔥 {isFr ? 'Populaire' : 'Popular'}
                  </Badge>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold line-clamp-2 leading-tight">{product.title}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-muted-foreground truncate">{org?.name}</p>
                  <p className="text-xs font-bold text-primary shrink-0">
                    {product.is_pwyw && (product.min_price || 0) > 0
                      ? `💰 ${isFr ? 'Dès' : 'From'} ${fmtPrice(product.min_price, false, product.currency, isFr ? 'Gratuit' : 'Free')}`
                      : fmtPrice(product.price || 0, product.is_free, product.currency, isFr ? 'Gratuit' : 'Free')}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
