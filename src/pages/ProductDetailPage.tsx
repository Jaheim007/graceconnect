import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  FileText, BookOpen, Music, Link2, ExternalLink, MessageCircle,
  Shield, HelpCircle, MessageSquareQuote, PackagePlus, Star,
  Pencil, Eye, EyeOff
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { formatCurrency, formatPrice } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { FormattedText } from '@/lib/formatText';
import { ProductReviews } from '@/components/products/ProductReviews';
import { AmbassadorBanner } from '@/components/products/AmbassadorBanner';
import { ProductPreviewViewer } from '@/components/products/ProductPreviewViewer';
import { ShareButtons } from '@/components/social/ShareButtons';
import { useBundleItems, useProductRecommendations } from '@/hooks/useBundlesAndRecommendations';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProductCard } from '@/components/products/ProductCard';

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
  const [searchParams, setSearchParams] = useSearchParams();
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
        .select('*, organizations(name, slug, logo_url, currency, description, banner_url)');
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

  const isUnpublished = product && !product.is_published;

  // Check if user can manage this org (owner/admin/editor)
  const { data: canManage } = useQuery({
    queryKey: ['can-manage-product', user?.id, product?.organization_id],
    queryFn: async () => {
      if (!user || !product?.organization_id) return false;
      const { data } = await db
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', product.organization_id)
        .maybeSingle();
      return data && ['owner', 'admin', 'editor'].includes(data.role);
    },
    enabled: !!user && !!product?.organization_id,
  });

  // Fetch org page settings for theme colors
  const orgId = product?.organization_id;
  const { data: pageSettings } = useQuery({
    queryKey: ['org-page-settings-product', orgId],
    queryFn: async () => {
      const { data } = await db
        .from('org_page_settings')
        .select('theme_primary_color, theme_accent_color')
        .eq('organization_id', orgId!)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const orgThemeStyle = useMemo(() => {
    const primary = pageSettings?.theme_primary_color;
    if (!primary) return {};
    return {
      '--org-primary': primary,
      '--org-accent': pageSettings?.theme_accent_color || primary,
    } as React.CSSProperties;
  }, [pageSettings]);

  const { data: purchases = [] } = useMyPurchases();
  const isPurchased = purchases.some(p => p.product_id === (productId || product?.id));
  
  const { data: bundleItems = [] } = useBundleItems(product?.is_bundle ? product?.id : undefined);
  const { data: recommendations = [] } = useProductRecommendations(product?.id);

  // Auto-open purchase modal when returning from auth with ?action=buy
  useEffect(() => {
    if (user && product && searchParams.get('action') === 'buy' && !purchaseProduct) {
      setPurchaseProduct(product as DigitalProduct);
      // Clean up the URL param
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [user, product, searchParams]);

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

  if (isUnpublished && !canManage) {
    return (
      <EmptyState
        title="Produit non publié"
        description="Ce produit existe mais n'est pas encore publié. L'administrateur doit activer la publication depuis l'espace admin."
        action={{ label: t('product.back'), onClick: () => navigate(-1) }}
        className="min-h-screen"
      />
    );
  }

  const org = (product as any).organizations;
  const aspectClass = coverAspectClass[product.product_type || 'other'] || 'aspect-video';
  const faqItems: { q: string; a: string }[] = (product as any).faq_json || [];
  const testimonials: { name: string; text: string }[] = (product as any).testimonials_json || [];
  const guaranteeText: string | null = (product as any).guarantee_text;

  const orgPrimary = pageSettings?.theme_primary_color;
  const bannerBg = orgPrimary
    ? { background: `linear-gradient(135deg, ${orgPrimary}18, ${orgPrimary}08, transparent)` }
    : {};
  const topBarStyle = orgPrimary
    ? { borderBottomColor: `${orgPrimary}30` }
    : {};

  return (
    <div className="min-h-screen bg-background" style={orgThemeStyle}>
      <SEOHead
        title={`${product.title} — ${org?.name || 'Siteviral'}`}
        description={product.description?.slice(0, 155) || `Achetez ${product.title} sur Siteviral — ${product.is_free ? 'Gratuit' : `${product.price} ${product.currency || 'XOF'}`}. Paiement Mobile Money & Carte.`}
        ogImage={product.cover_image_url || undefined}
        ogType="product"
        canonicalUrl={`https://siteviral.com/org/${slug}/p/${(product as any).slug || product.id}`}
        keywords={`${product.title}, ${org?.name || ''}, acheter ${product.product_type || 'produit numérique'}, ${product.currency || 'XOF'}, Siteviral`}
        jsonLd={[
          // Product schema
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description,
            image: product.cover_image_url,
            brand: { '@type': 'Organization', name: org?.name },
            offers: {
              '@type': 'Offer',
              price: product.is_free ? '0' : String(product.price || 0),
              priceCurrency: product.currency || 'USD',
              availability: 'https://schema.org/InStock',
              seller: { '@type': 'Organization', name: org?.name },
            },
            ...(product.review_count && product.review_count > 0 ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: String(product.average_rating || 0),
                reviewCount: String(product.review_count),
                bestRating: '5',
                worstRating: '1',
              },
            } : {}),
          },
          // BreadcrumbList schema
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Siteviral', item: 'https://siteviral.com' },
              { '@type': 'ListItem', position: 2, name: org?.name, item: `https://siteviral.com/org/${slug}` },
              { '@type': 'ListItem', position: 3, name: product.title, item: `https://siteviral.com/org/${slug}/p/${(product as any).slug || product.id}` },
            ],
          },
          // FAQ schema (if product has FAQ)
          ...(faqItems.length > 0 ? [{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }] : []),
        ]}
      />

      {/* Draft banner for admins */}
      {isUnpublished && canManage && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3">
          <div className="container max-w-5xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-medium text-amber-800 dark:text-amber-300">
                Brouillon — Ce produit n'est pas visible par vos visiteurs.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => navigate(`/admin/products/${product.id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                onClick={async () => {
                  const { error } = await db
                    .from('digital_products')
                    .update({ is_published: true })
                    .eq('id', product.id);
                  if (!error) {
                    toast({ title: '✅ Produit publié !', description: 'Votre produit est maintenant visible par tous.' });
                    window.location.reload();
                  } else {
                    toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
                  }
                }}
              >
                <Eye className="h-3.5 w-3.5" /> Publier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin edit button (even for published products) */}
      {!isUnpublished && canManage && (
        <div className="bg-muted/50 border-b border-border/50 px-4 py-2">
          <div className="container max-w-5xl flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => navigate(`/admin/products/${product.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" /> Modifier ce produit
            </Button>
          </div>
        </div>
      )}

      <div
        className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between"
        style={topBarStyle}
      >
        {org ? (
          <Link to={`/org/${slug}`} className="flex items-center gap-2.5">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground"
                style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}
              >
                {org.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold truncate max-w-[180px]">{org.name}</span>
          </Link>
        ) : (
          <Link to={user ? '/feed' : '/'}>
            <SiteLogo size="sm" linked={false} animate />
          </Link>
        )}
        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate(`/admin/products/${product.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> {t('product.back')}
          </Button>
        </div>
      </div>

      {/* Org-branded banner with org colors */}
      {org && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative border-b border-border/30 overflow-hidden"
          style={bannerBg}
        >
          {/* Fallback gradient if no custom color */}
          {!orgPrimary && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10" />
          )}
          {/* Banner image if org has one */}
          {org.banner_url && (
            <div className="absolute inset-0">
              <img src={org.banner_url} alt="" className="w-full h-full object-cover opacity-15" />
            </div>
          )}
          <div className="container max-w-5xl px-4 py-4 relative z-10">
            <div className="flex items-center gap-4">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="h-12 w-12 rounded-xl object-cover border-2 border-background shadow-md"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold text-primary-foreground shadow-md border-2 border-background"
                  style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}
                >
                  {org.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t('product.sold_by')}</p>
                <p className="font-bold text-sm">{org.name}</p>
                {org.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{org.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs shrink-0 bg-background/80 backdrop-blur-sm"
                onClick={() => navigate(`/org/${slug}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" /> {t('product.view')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="container max-w-5xl px-4 py-6">
        <div className="grid md:grid-cols-[1fr_340px] gap-6 md:gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={cn('rounded-2xl overflow-hidden border border-border shadow-card bg-muted/30 max-w-md mx-auto md:max-w-none', aspectClass)}>
              {product.cover_image_url ? (
                <img src={product.cover_image_url} alt={product.title} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-primary/10">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Product Preview Viewer */}
            <ProductPreviewViewer
              productId={product.id}
              fileUrl={(product as any).file_url}
              productType={product.product_type}
              pageCount={(product as any).page_count}
              previewPageCount={(product as any).preview_page_count}
              coverImageUrl={product.cover_image_url}
              title={product.title}
              isPurchased={isPurchased}
            />

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
              <div className="space-y-4 overflow-hidden">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  {t('product.description')}
                </h2>
                <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                  <FormattedText
                    text={product.description}
                    className="text-sm text-muted-foreground leading-relaxed break-words prose prose-sm max-w-none"
                  />
                </div>
              </div>
            )}

            {/* Bundle Items */}
            {(product as any).is_bundle && bundleItems.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <PackagePlus className="h-4 w-4 text-primary" /> Ce bundle inclut
                </h2>
                <div className="space-y-2">
                  {bundleItems.map((bi: any) => (
                    <div key={bi.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      {bi.included_product?.cover_image_url ? (
                        <img src={bi.included_product.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{bi.included_product?.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{bi.included_product?.product_type}</p>
                      </div>
                      {bi.included_product?.price > 0 && !bi.included_product?.is_free && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(bi.included_product.price, false, bi.included_product.currency)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guarantee */}
            {guaranteeText && (
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Garantie</p>
                    <p className="text-sm text-muted-foreground mt-1">{guaranteeText}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4" /> Témoignages
                </h2>
                <div className="space-y-2">
                  {testimonials.map((t, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <p className="text-sm italic text-muted-foreground">"{t.text}"</p>
                      <p className="text-xs font-semibold mt-2">— {t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {faqItems.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" /> Questions fréquentes
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Reviews section */}
            <ProductReviews
              productId={product.id}
              organizationId={product.organization_id}
              isPurchased={isPurchased}
            />

          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:sticky md:top-14 md:self-start space-y-4 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto">
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
                  className="w-full h-12 text-base gap-2 font-semibold text-white"
                  style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}

                  onClick={() => {
                    if (!user) { navigate(`/auth?returnTo=${encodeURIComponent(buildShareUrl())}`); return; }
                    setPurchaseProduct(product as DigitalProduct);
                  }}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {product.is_free ? t('product.get_free') : t('product.buy_now')}
                </Button>
              )}

              <div className="pt-2 border-t border-border/40">
                <ShareButtons
                  url={buildShareUrl()}
                  title={product.title}
                  description={product.description?.slice(0, 120) || ''}
                  compact
                />
              </div>
            </div>

            {/* Trust indicators in sidebar */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Shield className="h-4 w-4" style={{ color: orgPrimary || 'hsl(var(--primary))' }} />, label: 'Paiement sécurisé' },
                { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, label: 'Accès immédiat' },
                { icon: <Star className="h-4 w-4 text-yellow-500" />, label: 'Qualité garantie' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-border/60 bg-muted/30 text-center"
                >
                  {item.icon}
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">{item.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Ambassador Banner */}
            {!isPurchased && org && slug && (
              <AmbassadorBanner orgSlug={slug} orgName={org.name} />
            )}
          </motion.div>
        </div>

        {/* Recommended Products */}
        {recommendations.length > 0 && (
          <div className="mt-10 space-y-4">
            <h2 className="text-lg font-bold">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recommendations.map((rec: any) => rec.recommended_product && (
                <ProductCard
                  key={rec.id}
                  product={{ ...rec.recommended_product, organization_slug: slug }}
                  isPurchased={purchases.some(p => p.product_id === rec.recommended_product.id)}
                />
              ))}
            </div>
          </div>
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
