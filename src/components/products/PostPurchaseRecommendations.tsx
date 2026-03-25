import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostPurchaseRecommendationsProps {
  organizationId: string;
  productId: string;
  productType?: string;
  open: boolean;
}

export function PostPurchaseRecommendations({ organizationId, productId, productType, open }: PostPurchaseRecommendationsProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();

  const { data: recommendations } = useQuery({
    queryKey: ['post-purchase-recs', organizationId, productId],
    queryFn: async () => {
      // Get similar products from same org + same type
      let q = db
        .from('digital_products')
        .select('id, title, cover_image_url, price, is_free, currency, slug, organization_id, organizations(slug, name)')
        .eq('is_published', true)
        .eq('organization_id', organizationId)
        .neq('id', productId)
        .order('sales_count', { ascending: false })
        .limit(6);

      if (productType) q = q.eq('product_type', productType);

      const { data } = await q;

      // If too few from same type, fetch more from same org
      if ((data || []).length < 3) {
        const { data: moreData } = await db
          .from('digital_products')
          .select('id, title, cover_image_url, price, is_free, currency, slug, organization_id, organizations(slug, name)')
          .eq('is_published', true)
          .eq('organization_id', organizationId)
          .neq('id', productId)
          .order('sales_count', { ascending: false })
          .limit(6);
        const existingIds = new Set((data || []).map((p: any) => p.id));
        return [...(data || []), ...(moreData || []).filter((p: any) => !existingIds.has(p.id))].slice(0, 6);
      }
      return data || [];
    },
    enabled: open && !!organizationId,
    staleTime: 60_000,
  });

  if (!open || !recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold">
          {isFr ? 'Vous pourriez aussi aimer' : 'You might also like'}
        </p>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {recommendations.map((p: any) => {
            const orgSlug = p.organizations?.slug || '';
            const path = p.slug ? `/org/${orgSlug}/p/${p.slug}` : `/org/${orgSlug}/product/${p.id}`;
            return (
              <button
                key={p.id}
                onClick={() => navigate(path)}
                className="shrink-0 w-28 text-left group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted/50 border border-border group-hover:border-primary/30 transition-colors">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-medium mt-1 line-clamp-2">{p.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {getProductPriceLabel(p as any, isFr ? 'fr' : 'en').text}
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
