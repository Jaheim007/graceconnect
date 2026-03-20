import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/currency';
import { stripHtml } from '@/lib/formatText';
import { ShoppingBag, ExternalLink, Star, Download, Eye, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LocalPriceHint } from '@/components/payments/LocalPriceHint';
import { WishlistButton } from './WishlistButton';
import { useI18n } from '@/i18n/I18nContext';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc, getVerifiedLabel } from '@/lib/verifiedLabel';

interface ProductQuickViewProps {
  product: any;
  open: boolean;
  onClose: () => void;
}

export function ProductQuickView({ product, open, onClose }: ProductQuickViewProps) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (!product) return null;

  const orgSlug = product.organization_slug || '';
  const pSlug = product.slug;
  const detailPath = orgSlug
    ? (pSlug ? `/org/${orgSlug}/p/${pSlug}` : `/org/${orgSlug}/product/${product.id}`)
    : '';

  const salePrice = product.sale_price;
  const saleEndsAt = product.sale_ends_at;
  const isFlashSale = !product.is_pwyw && salePrice != null && saleEndsAt && new Date(saleEndsAt) > new Date();
  const displayPrice = isFlashSale ? salePrice : product.price;
  const fmt = (n: number) => formatPrice(n, product.is_free, product.currency);

  const goToDetail = () => {
    onClose();
    if (detailPath) navigate(detailPath);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Cover */}
        <div className="relative aspect-video bg-muted/50 overflow-hidden">
          {product.cover_image_url ? (
            <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <WishlistButton productId={product.id} />
          </div>
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex flex-col items-end px-3 py-1.5 rounded-lg text-base font-bold bg-background/90 backdrop-blur-sm border border-border/50">
              {isFlashSale && <span className="text-xs line-through text-muted-foreground">{fmt(product.price)}</span>}
              {fmt(displayPrice)}
              {!product.is_free && displayPrice > 0 && (
                <LocalPriceHint amount={displayPrice} currency={product.currency || 'XOF'} />
              )}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg leading-tight">{product.title}</DialogTitle>
            {product.organization_name && (
              <p className="text-xs text-muted-foreground mt-1">
                {isFr ? 'par' : 'by'}{' '}
                <button
                  onClick={() => { onClose(); navigate(`/org/${orgSlug}`); }}
                  className="font-semibold text-primary hover:underline"
                >
                  {product.organization_name}
                </button>
                {isOrgVerifiedOrKyc(product.is_org_verified, product.org_kyc_status) && <VerifiedBadge size="xs" label={getVerifiedLabel(product.org_category)} />}
              </p>
            )}
          </DialogHeader>

          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {stripHtml(product.description)}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] capitalize gap-1">
              {product.product_type || 'Produit'}
            </Badge>
            {(product.sales_count || 0) >= 10 && (
              <Badge className="bg-amber-500/90 text-white border-0 text-[10px]">🔥 Bestseller</Badge>
            )}
            {product.average_rating > 0 && (
              <Badge variant="outline" className="text-[10px] gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {product.average_rating.toFixed(1)}
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1 font-semibold" onClick={goToDetail}>
              {product.is_free ? (isFr ? 'Obtenir gratuitement' : 'Get for free') : (isFr ? 'Voir & Acheter' : 'View & Buy')}
            </Button>
            <Button variant="outline" size="icon" onClick={goToDetail} title={isFr ? 'Voir détails' : 'View details'}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
