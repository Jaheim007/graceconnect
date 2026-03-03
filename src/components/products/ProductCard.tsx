import { DigitalProduct } from '@/types/database';
import { useShortLink } from '@/hooks/useShortLink';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Download, ExternalLink, CheckCircle, BookOpen, Eye } from 'lucide-react';
import { FlashSaleBadge } from './FlashSaleBadge';
import { ShareWidget } from './ShareWidget';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

interface ProductCardProps {
  product: DigitalProduct & { slug?: string };
  onPurchase?: () => void;
  index?: number;
  isPurchased?: boolean;
  /** Hide commission badge (for public/buyer universe) */
  hideCommission?: boolean;
  /** Hide share widget (for public/buyer universe) */
  hideShare?: boolean;
}

const coverAspectClass: Record<string, string> = {
  pdf: 'aspect-[2/3]',
  ebook: 'aspect-[2/3]',
  audio: 'aspect-square',
  video: 'aspect-video',
  course: 'aspect-video',
  other: 'aspect-video',
};

export function ProductCard({ product, onPurchase, index = 0, isPurchased, hideCommission, hideShare }: ProductCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const organizationId = (product as any).organization_id;
  const orgSlug = (product as any).organization_slug || '';

  const { data: affiliateCode } = useQuery({
    queryKey: ['my-aff-code', user?.id, organizationId],
    queryFn: async () => {
      if (!user) return null;
      const { data: link } = await db.from('affiliate_links').select('code').eq('user_id', user.id).eq('organization_id', organizationId).eq('is_active', true).maybeSingle();
      return link?.code || null;
    },
    enabled: !!user && !!organizationId,
    staleTime: 1000 * 60 * 10,
  });

  const { data: orgData } = useQuery({
    queryKey: ['org-slug-for-card', organizationId],
    queryFn: async () => {
      const { data } = await db.from('organizations').select('slug').eq('id', organizationId).maybeSingle();
      return data;
    },
    enabled: !orgSlug && !!organizationId,
    staleTime: 1000 * 60 * 30,
  });

  const resolvedSlug = orgSlug || orgData?.slug || '';
  const pSlug = (product as any).slug;
  const buildDetailPath = (orgSlugValue: string) => (
    pSlug ? `/org/${orgSlugValue}/p/${pSlug}` : `/org/${orgSlugValue}/product/${product.id}`
  );
  const detailPath = resolvedSlug ? buildDetailPath(resolvedSlug) : '';

  const refSuffix = affiliateCode ? `?ref=${affiliateCode}` : '';
  const shareTargetPath = `${detailPath || '/marketplace'}${refSuffix}`;

  const { shareUrl: socialShareUrl } = useShortLink({
    targetPath: shareTargetPath,
    title: product.title,
    description: product.description?.slice(0, 155) || undefined,
    image: product.cover_image_url || undefined,
  });

  const canPreview = !!(product as any).file_url && ['pdf', 'ebook'].includes((product.product_type || '').toLowerCase());
  const commissionPercent = (product as any).commission_percent;

  const openProductPage = async (withPreview = false) => {
    let finalSlug = resolvedSlug;

    if (!finalSlug && organizationId) {
      const { data } = await db.from('organizations').select('slug').eq('id', organizationId).maybeSingle();
      finalSlug = data?.slug || '';
    }

    if (!finalSlug) {
      toast({
        title: 'Produit indisponible',
        description: 'Impossible d’ouvrir ce produit pour le moment.',
        variant: 'destructive',
      });
      return;
    }

    const path = buildDetailPath(finalSlug);
    navigate(withPreview ? `${path}?preview=1` : path);
  };

  const handleCardClick = () => {
    void openProductPage(false);
  };

  const salePrice = (product as any).sale_price;
  const saleEndsAt = (product as any).sale_ends_at;
  const isFlashSale = salePrice != null && saleEndsAt && new Date(saleEndsAt) > new Date();
  const displayPrice = isFlashSale ? salePrice : product.price;

  const fmt = (n: number) => formatPrice(n, product.is_free, product.currency);

  const typeLabels: Record<string, string> = { pdf: 'PDF', ebook: 'eBook', audio: 'Audio', video: 'Vidéo', course: 'Cours', link: 'Lien', default: 'Produit' };
  const typeIcons: Record<string, React.ReactNode> = {
    pdf: <Download className="h-3.5 w-3.5" />,
    ebook: <BookOpen className="h-3.5 w-3.5" />,
    audio: <ShoppingBag className="h-3.5 w-3.5" />,
    video: <ExternalLink className="h-3.5 w-3.5" />,
    link: <ExternalLink className="h-3.5 w-3.5" />,
    default: <ShoppingBag className="h-3.5 w-3.5" />,
  };

  const aspectClass = coverAspectClass[product.product_type || 'other'] || 'aspect-video';

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className={cn('relative overflow-hidden bg-muted/50', aspectClass)}>
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-14 w-14 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            {isPurchased && (
              <Badge className="bg-emerald-600/90 text-white border-0 text-[10px] gap-1 font-semibold w-fit">
                <CheckCircle className="h-3 w-3" /> Acheté
              </Badge>
            )}
            {/* A3: "Nouveau" badge for products < 7 days old */}
            {!isPurchased && product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 7 * 86400000 && (
              <Badge className="bg-blue-500/90 text-white border-0 text-[10px] font-semibold w-fit">
                ✨ Nouveau
              </Badge>
            )}
            {/* A3: "Bestseller" badge for 10+ sales */}
            {!isPurchased && (product.sales_count || 0) >= 10 && (
              <Badge className="bg-amber-500/90 text-white border-0 text-[10px] font-semibold w-fit">
                🔥 Bestseller
              </Badge>
            )}
            {isFlashSale && (
              <FlashSaleBadge saleEndsAt={saleEndsAt} salePrice={salePrice} originalPrice={product.price} />
            )}
          </div>
        </div>
        <div className="absolute bottom-2.5 right-2.5">
          <span className={cn(
            'inline-block px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm',
            product.is_free
              ? 'bg-emerald-600 text-white'
              : 'bg-background/90 backdrop-blur-sm text-foreground border border-border/50'
          )}>
            {isFlashSale && <span className="text-[10px] line-through text-muted-foreground mr-1">{fmt(product.price)}</span>}
            {fmt(displayPrice)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div>
          <h3 className="font-bold text-sm line-clamp-2 leading-snug">{product.title}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            {(product as any).organization_name && (
              <p className="text-[11px] text-muted-foreground">
                par{' '}
                <span
                  className="font-semibold text-primary hover:underline cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); navigate(`/org/${resolvedSlug}`); }}
                >
                  {(product as any).organization_name}
                </span>
              </p>
            )}
            {!hideCommission && commissionPercent != null && commissionPercent > 0 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-accent border-accent/30">
                {commissionPercent}% commission
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5 gap-1 capitalize">
            {typeIcons[product.product_type] || typeIcons.default}
            {typeLabels[product.product_type] || product.product_type}
          </Badge>

          <div className="flex items-center gap-1 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
            {canPreview && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  void openProductPage(true);
                }}
              >
                <Eye className="h-3 w-3" />
                Aperçu
              </Button>
            )}

            {!hideShare && <ShareWidget url={socialShareUrl} title={product.title} description={product.description || undefined} />}

            {isPurchased ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] px-2.5 gap-1 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={(e) => { e.stopPropagation(); navigate('/resources'); }}
              >
                <BookOpen className="h-3 w-3" /> Mes Ressources
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPurchase) {
                    onPurchase();
                  } else {
                    void openProductPage(false);
                  }
                }}
                className="h-7 text-[11px] px-3 font-semibold"
              >
                {product.is_free ? 'Obtenir' : 'Acheter'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
