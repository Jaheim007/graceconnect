import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

interface SmartRecommendationsProps {
  /** Current product to exclude */
  excludeProductId?: string;
  /** Org ID for same-org recs */
  organizationId?: string;
  /** Product type for similar recs */
  productType?: string;
  /** Max items */
  limit?: number;
  /** Title override */
  title?: string;
}

/**
 * Smart product recommendations — shows relevant products based on:
 * 1. Same org (if provided)
 * 2. Same product type
 * 3. Fallback to top sellers
 */
export function SmartRecommendations({
  excludeProductId,
  organizationId,
  productType,
  limit = 4,
  title = 'Tu pourrais aussi aimer',
}: SmartRecommendationsProps) {
  const navigate = useNavigate();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['smart-recs', excludeProductId, organizationId, productType, limit],
    queryFn: async () => {
      // Strategy 1: Same org products
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

      // Strategy 2: Same product type
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

      // Strategy 3: Global top sellers
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
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-extrabold">{title}</h3>
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
                    🔥 Populaire
                  </Badge>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold line-clamp-2 leading-tight">{product.title}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-muted-foreground truncate">{org?.name}</p>
                  <p className="text-xs font-bold text-primary shrink-0">
                    {product.is_free ? 'Gratuit' : formatCurrency(product.price || 0, product.currency || DEFAULT_CURRENCY)}
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
