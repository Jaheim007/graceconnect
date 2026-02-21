import { DigitalProduct } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: DigitalProduct;
  onPurchase?: () => void;
  index?: number;
}

export function ProductCard({ product, onPurchase, index = 0 }: ProductCardProps) {
  const fmt = (n: number) =>
    n === 0 || product.is_free
      ? 'Free'
      : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: product.currency || 'XOF', maximumFractionDigits: 0 }).format(n);

  const typeIcons: Record<string, React.ReactNode> = {
    pdf: <Download className="h-3.5 w-3.5" />,
    link: <ExternalLink className="h-3.5 w-3.5" />,
    default: <ShoppingBag className="h-3.5 w-3.5" />,
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-200 group animate-fade-in"
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'both' }}
    >
      <div className="relative h-36 bg-gradient-to-br from-accent/10 to-primary/10 overflow-hidden">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {product.is_featured && (
          <Badge className="absolute top-2 right-2 gold-gradient text-primary-foreground border-0 text-[10px]">
            Featured
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-2.5">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{product.title}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={cn('font-bold text-sm', product.is_free ? 'text-green-500' : 'text-primary')}>
              {fmt(product.price)}
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 capitalize">
              {typeIcons[product.product_type] || typeIcons.default}
              {product.product_type}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {product.external_link && !product.file_url && (product.is_free || product.price === 0) && (
              <a href={product.external_link} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1">
                  <ExternalLink className="h-3 w-3" /> Open
                </Button>
              </a>
            )}
            <Button
              size="sm"
              onClick={onPurchase}
              className="h-7 text-xs px-3 gold-gradient text-primary-foreground border-0 shadow-gold"
            >
              {product.is_free ? 'Get Free' : 'Buy Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
