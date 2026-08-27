import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Zap, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/currency';

interface UpsellProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  cover_image_url: string | null;
  slug: string | null;
  org_slug: string;
}

interface UpsellSectionProps {
  productId?: string;
  orgId?: string;
  currentProductId?: string;
}

export function UpsellSection({ productId, orgId, currentProductId }: UpsellSectionProps) {
  const navigate = useNavigate();
  const [upsells, setUpsells] = useState<UpsellProduct[]>([]);

  useEffect(() => {
    if (!orgId) return;

    async function loadUpsells() {
      // Strategy 1: If product has explicit upsell_product_ids
      if (productId) {
        const { data: product } = await db
          .from('digital_products')
          .select('upsell_product_ids, order_bump_product_id')
          .eq('id', productId)
          .maybeSingle();

        const upsellIds: string[] = [
          ...(product?.upsell_product_ids || []),
          ...(product?.order_bump_product_id ? [product.order_bump_product_id] : []),
        ].filter((id: string) => id !== currentProductId && id !== productId);

        if (upsellIds.length > 0) {
          const { data } = await db
            .from('digital_products')
            .select('id, title, price, currency, cover_image_url, slug, organizations(slug)')
            .in('id', upsellIds)
            .eq('is_published', true)
            .limit(3);

          if (data && data.length > 0) {
            setUpsells(data.map((p: any) => ({ ...p, org_slug: p.organizations?.slug || '' })));
            return;
          }
        }
      }

      // Strategy 2: Fallback — show other popular products from the same org
      const { data } = await db
        .from('digital_products')
        .select('id, title, price, currency, cover_image_url, slug, organizations(slug)')
        .eq('organization_id', orgId ?? '')
        .eq('is_published', true)
        .neq('id', currentProductId || '')
        .order('sales_count', { ascending: false })
        .limit(3);

      if (data) {
        setUpsells(data.map((p: any) => ({ ...p, org_slug: p.organizations?.slug || '' })));
      }
    }

    loadUpsells();
  }, [productId, orgId, currentProductId]);

  if (upsells.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <ThumbsUp className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-bold">Vous pourriez aussi aimer</p>
      </div>

      <div className="space-y-3">
        {upsells.map((product) => (
          <button
            key={product.id}
            onClick={() => {
              const path = product.slug
                ? `/org/${product.org_slug}/p/${product.slug}`
                : `/org/${product.org_slug}/product/${product.id}`;
              navigate(path);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left group"
          >
            {product.cover_image_url ? (
              <img src={product.cover_image_url} alt={product.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{product.title}</p>
              <Badge variant="outline" className="text-[10px] mt-1">
                {product.price > 0
                  ? formatCurrency(product.price, product.currency)
                  : 'Gratuit'}
              </Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
