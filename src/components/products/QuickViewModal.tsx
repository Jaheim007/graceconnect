import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Eye, Star, X, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FormattedText, stripHtml } from '@/lib/formatText';
import { ContentSizeBadge } from '@/components/products/ContentSizeBadge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface QuickViewModalProps {
  product: any;
  orgSlug: string;
  open: boolean;
  onClose: () => void;
  isPurchased?: boolean;
}

export function QuickViewModal({ product, orgSlug, open, onClose, isPurchased }: QuickViewModalProps) {
  const navigate = useNavigate();
  if (!product) return null;

  const fullPath = product.slug
    ? `/org/${orgSlug}/p/${product.slug}`
    : `/org/${orgSlug}/product/${product.id}`;

  const typeLabels: Record<string, string> = {
    pdf: 'PDF', ebook: 'E-book', audio: 'Audio', video: 'Vidéo', course: 'Cours', link: 'Lien',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        {/* Cover */}
        <div className="relative aspect-[3/2] bg-muted overflow-hidden">
          {product.cover_image_url ? (
            <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}
          {/* Price overlay */}
          <div className="absolute bottom-3 left-3">
            <div className={cn(
              'px-3 py-1.5 rounded-lg font-bold text-sm backdrop-blur-md',
              product.is_free
                ? 'bg-emerald-500/90 text-white'
                : 'bg-background/90 text-foreground border border-border/50'
            )}>
              {formatPrice(product.price || 0, product.is_free, product.currency)}
            </div>
          </div>
          {product.sale_price && product.sale_price < product.price && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-destructive text-destructive-foreground text-xs">
                -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold leading-tight">{product.title}</h3>
              {product.average_rating > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold">{product.average_rating?.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px] capitalize">
                {typeLabels[product.product_type || 'pdf'] || product.product_type}
              </Badge>
              {product.sales_count > 0 && (
                <span className="text-[10px] text-muted-foreground">{product.sales_count}+ ventes</span>
              )}
              <ContentSizeBadge
                pageCount={product.page_count}
                productType={product.product_type}
              />
            </div>
          </div>

          {product.description && (
            <div className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
              <FormattedText text={stripHtml(product.description).slice(0, 300)} />
            </div>
          )}

          {/* Org info */}
          {product.organizations && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {product.organizations.logo_url ? (
                <img src={product.organizations.logo_url} className="h-5 w-5 rounded object-cover" alt="" />
              ) : (
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                  {product.organizations.name?.[0]}
                </div>
              )}
              <span className="font-medium flex items-center gap-1">{product.organizations.name} {product.organizations.is_verified && <VerifiedBadge size="xs" showTooltip={false} />}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isPurchased ? (
              <Button className="flex-1 gap-2" onClick={() => { onClose(); navigate('/resources'); }}>
                <Eye className="h-4 w-4" /> Accéder
              </Button>
            ) : (
              <Button className="flex-1 gap-2" onClick={() => { onClose(); navigate(fullPath); }}>
                <ShoppingBag className="h-4 w-4" />
                {product.is_free ? 'Obtenir' : 'Acheter'}
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={() => { onClose(); navigate(fullPath); }}>
              <ExternalLink className="h-4 w-4" /> Détails
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
