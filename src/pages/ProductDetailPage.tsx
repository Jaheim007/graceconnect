import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';
import { useMyPurchases } from '@/hooks/usePurchases';
import { useAuth } from '@/contexts/AuthContext';
import { DigitalProduct } from '@/types/database';
import {
  ArrowLeft, ShoppingBag, Share2, Copy, CheckCircle,
  FileText, BookOpen, Music, Link2, ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const fmt = (n: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  ebook: <BookOpen className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  link: <Link2 className="h-5 w-5" />,
};

export default function ProductDetailPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchaseProduct, setPurchaseProduct] = useState<DigitalProduct | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = await db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, description)')
        .eq('id', productId)
        .eq('is_published', true)
        .maybeSingle();
      return data;
    },
    enabled: !!productId,
  });

  const { data: purchases = [] } = useMyPurchases();
  const isPurchased = purchases.some(p => p.product_id === productId);

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'Lien copié !' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product?.title, url });
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-8 px-4">
          <div className="h-64 rounded-2xl skeleton-shimmer mb-4" />
          <div className="h-8 w-2/3 rounded-lg skeleton-shimmer mb-2" />
          <div className="h-4 w-1/3 rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Produit introuvable"
        description="Ce produit n'existe pas ou n'est pas publié."
        action={{ label: 'Retour', onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const org = (product as any).organizations;
  const productUrl = window.location.href;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Link to={`/org/${slug}`}>
          <span className="text-lg font-extrabold tracking-tight italic text-gold">Siteviral</span>
        </Link>
      </div>

      <div className="container max-w-3xl px-4 py-6 space-y-6">
        {/* Product hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Cover image */}
          {product.cover_image_url ? (
            <div className="aspect-video rounded-2xl overflow-hidden border border-border shadow-card">
              <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video rounded-2xl gold-gradient flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-primary-foreground/50" />
            </div>
          )}

          {/* Title & meta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px] capitalize">
                {typeIcons[product.product_type || 'pdf']} {product.product_type || 'PDF'}
              </Badge>
              {product.sales_count && product.sales_count > 0 && (
                <span className="text-xs text-muted-foreground">{product.sales_count} vente{product.sales_count > 1 ? 's' : ''}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{product.title}</h1>
            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            )}
          </div>

          {/* Price & actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-2xl font-bold text-primary">
              {product.is_free ? 'Gratuit' : fmt(product.price || 0, product.currency || 'XOF')}
            </div>
            {isPurchased ? (
              <Badge className="bg-primary/10 text-primary border-0 gap-1">
                <CheckCircle className="h-3 w-3" /> Déjà acheté
              </Badge>
            ) : (
              <Button
                className="gold-gradient text-primary-foreground border-0 shadow-gold gap-2"
                onClick={() => {
                  if (!user) { navigate(`/auth?returnTo=${encodeURIComponent(productUrl)}`); return; }
                  setPurchaseProduct(product as DigitalProduct);
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                {product.is_free ? 'Obtenir gratuitement' : 'Acheter maintenant'}
              </Button>
            )}
          </div>

          {/* Share row */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" /> Partager
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopyLink}>
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copié' : 'Copier le lien'}
            </Button>
          </div>
        </motion.div>

        {/* Org info */}
        {org && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl border border-border bg-card shadow-card"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vendu par</p>
            <div className="flex items-center gap-3">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="h-12 w-12 rounded-xl object-cover border border-border" />
              ) : (
                <div className="h-12 w-12 rounded-xl gold-gradient flex items-center justify-center text-lg font-bold text-primary-foreground">
                  {org.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{org.name}</p>
                {org.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{org.description}</p>}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => navigate(`/org/${slug}`)}>
                <ExternalLink className="h-3.5 w-3.5" /> Voir la page
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <ProductPurchaseModal
        product={purchaseProduct}
        organizationId={product.organization_id}
        open={!!purchaseProduct}
        onClose={() => setPurchaseProduct(null)}
      />
    </div>
  );
}
