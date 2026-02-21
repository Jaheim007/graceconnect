import { DigitalProduct } from '@/types/database';
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

export function ProductCard({ product, onPurchase, index = 0, isPurchased }: ProductCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const orgSlug = (product as any).organization_slug || '';

  // Get user's affiliate code for this org to auto-append ?ref=
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

  // Build share URL with product slug + affiliate ref
  const pSlug = (product as any).slug;
  const basePath = pSlug ? `/org/${orgSlug}/p/${pSlug}` : `/org/${orgSlug}/product/${product.id}`;
  let shareUrl = `https://siteviral.com${basePath}`;
  if (affiliateCode) shareUrl += `?ref=${affiliateCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Lien copié !' });
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${product.title} — ${shareUrl}`)}`, '_blank');
  };

  const fmt = (n: number) =>
    n === 0 || product.is_free
      ? 'Gratuit'
      : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: product.currency || 'XOF', maximumFractionDigits: 0 }).format(n);

  const typeLabels: Record<string, string> = { pdf: 'PDF', link: 'Lien', default: 'Produit' };
  const typeIcons: Record<string, React.ReactNode> = {
    pdf: <Download className="h-3.5 w-3.5" />,
    link: <ExternalLink className="h-3.5 w-3.5" />,
    default: <ShoppingBag className="h-3.5 w-3.5" />,
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className="relative h-44 bg-gradient-to-br from-accent/10 to-primary/10 overflow-hidden">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-14 w-14 text-muted-foreground/20" />
          </div>
        )}
        {product.is_featured && (
          <Badge className="absolute top-3 right-3 gold-gradient text-primary-foreground border-0 text-[10px] font-bold">
            En vedette
          </Badge>
        )}
        {isPurchased && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-emerald-600/90 text-primary-foreground border-0 text-[10px] gap-1 font-semibold">
              <CheckCircle className="h-3 w-3" /> Acheté
            </Badge>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-bold text-base line-clamp-2 leading-snug">{product.title}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!isPurchased && (
              <span className={cn('font-bold text-base', product.is_free ? 'text-emerald-500' : 'text-primary')}>
                {fmt(product.price)}
              </span>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5 gap-1 capitalize">
              {typeIcons[product.product_type] || typeIcons.default}
              {typeLabels[product.product_type] || product.product_type}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
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
                className="h-8 text-xs px-3 gap-1.5 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => navigate('/dashboard')}
              >
                <BookOpen className="h-3.5 w-3.5" /> Mes Ressources
              </Button>
            ) : product.external_link ? (
              <a href={product.external_link} target="_blank" rel="noreferrer">
                <Button size="sm" className="h-8 text-xs px-4 gold-gradient text-primary-foreground border-0 shadow-gold gap-1.5 font-semibold">
                  <ExternalLink className="h-3.5 w-3.5" /> {product.is_free ? 'Ouvrir' : 'Accéder'}
                </Button>
              </a>
            ) : (
              <Button
                size="sm"
                onClick={onPurchase}
                className="h-8 text-xs px-4 gold-gradient text-primary-foreground border-0 shadow-gold font-semibold"
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
