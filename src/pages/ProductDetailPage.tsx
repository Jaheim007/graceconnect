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
  FileText, BookOpen, Music, Link2, ExternalLink, MessageCircle
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency, formatPrice } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  ebook: <BookOpen className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
};

const coverAspectClass: Record<string, string> = {
  pdf: 'aspect-[2/3]',
  ebook: 'aspect-[2/3]',
  audio: 'aspect-square',
  video: 'aspect-video',
  course: 'aspect-video',
  other: 'aspect-video',
};

export default function ProductDetailPage() {
  const { slug, productId, productSlug } = useParams<{ slug: string; productId?: string; productSlug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [purchaseProduct, setPurchaseProduct] = useState<DigitalProduct | null>(null);
  const [copied, setCopied] = useState(false);

  const typeLabels: Record<string, string> = {
    pdf: t('product.type_pdf'), ebook: t('product.type_ebook'), audio: t('product.type_audio'),
    video: t('product.type_video'), course: t('product.type_course'), link: t('product.type_link'),
  };

  const { data: affiliateCode } = useQuery({
    queryKey: ['my-affiliate-code', user?.id, slug],
    queryFn: async () => {
      if (!user || !slug) return null;
      const { data: org } = await db.from('organizations').select('id').eq('slug', slug).maybeSingle();
      if (!org) return null;
      const { data: link } = await db.from('affiliate_links').select('code').eq('user_id', user.id).eq('organization_id', org.id).eq('is_active', true).maybeSingle();
      return link?.code || null;
    },
    enabled: !!user && !!slug,
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', productId || productSlug],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, description)')
        .eq('is_published', true);
      if (productId) {
        q = q.eq('id', productId);
      } else if (productSlug && slug) {
        q = q.eq('slug', productSlug);
      }
      const { data } = await q.maybeSingle();
      return data;
    },
    enabled: !!(productId || productSlug),
  });

  const { data: purchases = [] } = useMyPurchases();
  const isPurchased = purchases.some(p => p.product_id === (productId || product?.id));

  const buildShareUrl = () => {
    const pSlug = (product as any)?.slug;
    const basePath = pSlug ? `/org/${slug}/p/${pSlug}` : `/org/${slug}/product/${product?.id}`;
    let url = `https://siteviral.com${basePath}`;
    if (affiliateCode) url += `?ref=${affiliateCode}`;
    return url;
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildShareUrl());
    setCopied(true);
    toast({ title: t('product.link_copied') });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${product?.title} — ${buildShareUrl()}`)}`, '_blank');
  };

  const handleShare = async () => {
    const url = buildShareUrl();
    if (navigator.share) {
      await navigator.share({ title: product?.title, url });
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl py-8 px-4">
          <div className="grid md:grid-cols-[1fr_340px] gap-8">
            <div className="h-96 rounded-2xl skeleton-shimmer" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-1/3 rounded skeleton-shimmer" />
              <div className="h-12 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title={t('product.not_found')}
        description={t('product.not_found_desc')}
        action={{ label: t('product.back'), onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const org = (product as any).organizations;
  const aspectClass = coverAspectClass[product.product_type || 'other'] || 'aspect-video';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${product.title} — Siteviral`}
        description={product.description?.slice(0, 155) || `Buy ${product.title} on Siteviral`}
        ogImage={product.cover_image_url || undefined}
        ogType="product"
        canonicalUrl={`https://siteviral.com/org/${slug}/p/${(product as any).slug || product.id}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          description: product.description,
          image: product.cover_image_url,
          offers: {
            '@type': 'Offer',
            price: product.is_free ? '0' : String(product.price || 0),
            priceCurrency: product.currency || 'USD',
            availability: 'https://schema.org/InStock',
          },
        }}
      />
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between">
        <Link to={user ? '/feed' : '/'}>
          <span className="text-lg font-extrabold tracking-tight italic text-primary">Siteviral</span>
        </Link>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> {t('product.back')}
        </Button>
      </div>

      <div className="container max-w-5xl px-4 py-6">
        <div className="grid md:grid-cols-[1fr_340px] gap-6 md:gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={cn('rounded-2xl overflow-hidden border border-border shadow-card bg-muted/30 max-w-md mx-auto md:max-w-none', aspectClass)}>
              {product.cover_image_url ? (
                <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-primary/10">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
                </div>
              )}
            </div>

            <div className="md:hidden space-y-2">
              <h1 className="text-2xl font-bold">{product.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs capitalize gap-1">
                  {typeIcons[product.product_type || 'pdf']} {typeLabels[product.product_type || 'pdf'] || product.product_type}
                </Badge>
                {product.sales_count && product.sales_count > 0 && (
                  <span className="text-xs text-muted-foreground">{product.sales_count}+ {t('product.sales')}</span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold">{t('product.description')}</h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              </div>
            )}

            {org && (
              <div className="p-4 rounded-2xl border border-border bg-card shadow-card">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('product.sold_by')}</p>
                <div className="flex items-center gap-3">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="h-12 w-12 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {org.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{org.name}</p>
                    {org.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{org.description}</p>}
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => navigate(`/org/${slug}`)}>
                    <ExternalLink className="h-3.5 w-3.5" /> {t('product.view')}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:sticky md:top-16 md:self-start space-y-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-card space-y-4">
              <div className="hidden md:block space-y-2">
                <h1 className="text-xl font-bold leading-snug">{product.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs capitalize gap-1">
                    {typeIcons[product.product_type || 'pdf']} {typeLabels[product.product_type || 'pdf'] || product.product_type}
                  </Badge>
                  {product.sales_count && product.sales_count > 0 && (
                    <span className="text-xs text-muted-foreground">{product.sales_count}+ {t('product.sales')}</span>
                  )}
                </div>
              </div>

              <div className="text-center py-2">
                <span className={cn('text-3xl font-bold', product.is_free ? 'text-emerald-500' : 'text-primary')}>
                  {formatPrice(product.price || 0, product.is_free, product.currency)}
                </span>
              </div>

              {isPurchased ? (
                <div className="space-y-2">
                  <Badge className="w-full justify-center py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5">
                    <CheckCircle className="h-4 w-4" /> {t('product.already_purchased')}
                  </Badge>
                  <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/dashboard')}>
                    <BookOpen className="h-4 w-4" /> {t('product.access_resources')}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-12 text-base bg-primary text-primary-foreground gap-2 font-semibold"
                  onClick={() => {
                    if (!user) { navigate(`/auth?returnTo=${encodeURIComponent(buildShareUrl())}`); return; }
                    setPurchaseProduct(product as DigitalProduct);
                  }}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {product.is_free ? t('product.get_free') : t('product.buy_now')}
                </Button>
              )}

              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/40">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5" /> {t('product.share')}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopyLink}>
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('product.copied') : t('product.copy')}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShareWhatsApp}>
                  <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
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
