import { DigitalProduct } from '@/types/database';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Download, ExternalLink, CheckCircle, BookOpen, Share2, Copy, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductCardProps {
  product: DigitalProduct & { slug?: string };
  onPurchase?: () => void;
  index?: number;
  isPurchased?: boolean;
}

const coverAspectClass: Record<string, string> = {
  pdf: 'aspect-[2/3]',
  ebook: 'aspect-[2/3]',
  audio: 'aspect-square',
  video: 'aspect-video',
  course: 'aspect-video',
  other: 'aspect-video',
};

export function ProductCard({ product, onPurchase, index = 0, isPurchased }: ProductCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const orgSlug = (product as any).organization_slug || '';

  const { data: affiliateCode } = useQuery({
    queryKey: ['my-aff-code', user?.id, (product as any).organization_id],
    queryFn: async () => {
      if (!user) return null;
      const { data: link } = await db.from('affiliate_links').select('code').eq('user_id', user.id).eq('organization_id', (product as any).organization_id).eq('is_active', true).maybeSingle();
      return link?.code || null;
    },
    enabled: !!user && !!(product as any).organization_id,
    staleTime: 1000 * 60 * 10,
  });

  const { data: orgData } = useQuery({
    queryKey: ['org-slug-for-card', (product as any).organization_id],
    queryFn: async () => {
      const { data } = await db.from('organizations').select('slug').eq('id', (product as any).organization_id).maybeSingle();
      return data;
    },
    enabled: !orgSlug && !!(product as any).organization_id,
    staleTime: 1000 * 60 * 30,
  });

  const resolvedSlug = orgSlug || orgData?.slug || '';
  const pSlug = (product as any).slug;
  const detailPath = pSlug
    ? `/org/${resolvedSlug}/p/${pSlug}`
    : `/org/${resolvedSlug}/product/${product.id}`;

  let shareUrl = `https://siteviral.com${detailPath}`;
  if (affiliateCode) shareUrl += `?ref=${affiliateCode}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Lien copié !' });
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${product.title} — ${shareUrl}`)}`, '_blank');
  };

  const handleCardClick = () => {
    if (resolvedSlug) navigate(detailPath);
  };

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
          </div>
          {product.is_featured && (
            <Badge className="bg-accent text-accent-foreground border-0 text-[10px] font-bold">
              En vedette
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2.5 right-2.5">
          <span className={cn(
            'inline-block px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm',
            product.is_free
              ? 'bg-emerald-600 text-white'
              : 'bg-background/90 backdrop-blur-sm text-foreground border border-border/50'
          )}>
            {fmt(product.price)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div>
          <h3 className="font-bold text-sm line-clamp-2 leading-snug">{product.title}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5 gap-1 capitalize">
            {typeIcons[product.product_type] || typeIcons.default}
            {typeLabels[product.product_type] || product.product_type}
          </Badge>

          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2 text-xs">
                  <Copy className="h-3.5 w-3.5" /> Copier le lien
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsApp} className="gap-2 text-xs">
                  <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isPurchased ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] px-2.5 gap-1 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={(e) => { e.stopPropagation(); navigate('/dashboard'); }}
              >
                <BookOpen className="h-3 w-3" /> Mes Ressources
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPurchase?.(); }}
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
