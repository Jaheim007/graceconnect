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
  FileText, BookOpen, Music, Link2, ExternalLink,
  Shield, Pencil, Eye, EyeOff, Flag
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ReportContentDialog } from '@/components/reports/ReportContentDialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { formatCurrency, formatPrice } from '@/lib/currency';
import { getEffectivePrice } from '@/lib/effectivePrice';
import { LocalPriceHint } from '@/components/payments/LocalPriceHint';
import { useI18n } from '@/i18n/I18nContext';
import { FormattedText, stripHtml } from '@/lib/formatText';
import { ProductReviews } from '@/components/products/ProductReviews';
import { ProductSidebarExtras } from '@/components/products/ProductSidebarExtras';
import { ProductMainContentExtras } from '@/components/products/ProductMainContentExtras';

import { ProductPreviewViewer } from '@/components/products/ProductPreviewViewer';
import { ShareButtons } from '@/components/social/ShareButtons';
import { PrintableQRCode } from '@/components/sharing/PrintableQRCode';
import { useBundleItems, useProductRecommendations } from '@/hooks/useBundlesAndRecommendations';
import { ProductCard } from '@/components/products/ProductCard';
import { getOrCreateShortLink, buildSocialShareUrl } from '@/lib/shareMeta';
import { useAutoAffiliateCode } from '@/hooks/useAutoAffiliateCode';
import { CrossSellWidget } from '@/components/products/CrossSellWidget';
import { SubscriptionUpsellPrompt } from '@/components/subscriptions/SubscriptionUpsellPrompt';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { WishlistButton } from '@/components/products/WishlistButton';
import { PostPurchaseCelebration } from '@/components/products/PostPurchaseCelebration';
import { SocialProofWidget } from '@/components/products/SocialProofWidget';
import { trackProductView } from '@/components/discover/RecentlyViewedProducts';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc, getVerifiedLabel } from '@/lib/verifiedLabel';
import { UrgencyWidget } from '@/components/products/UrgencyWidget';
import { ContentSizeBadge } from '@/components/products/ContentSizeBadge';
import { SmartCTA } from '@/components/products/SmartCTA';
import { ExperimentTitle } from '@/components/products/ExperimentTitle';
import { ExperimentDescription } from '@/components/products/ExperimentDescription';
import { ReviewSummaryBadge } from '@/components/products/ReviewSummaryBadge';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { StickyBuyBar } from '@/components/products/StickyBuyBar';
import { ReadingProgressBar } from '@/components/ui/ReadingProgressBar';
import { ProductTableOfContents } from '@/components/products/ProductTableOfContents';
import { PixelInjector } from '@/components/org/PixelInjector';
import { ContactSellerWidget } from '@/components/products/ContactSellerWidget';
import { FlyerDialog } from '@/components/flyer/FlyerDialog';
import { truncateWords } from '@/lib/truncateText';
import { Image as ImageIcon } from 'lucide-react';

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
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const [purchaseProduct, setPurchaseProduct] = useState<DigitalProduct | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [flyerOpen, setFlyerOpen] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (productId) trackProductView(productId);
  }, [productId]);

  const typeLabels: Record<string, string> = {
    pdf: t('product.type_pdf'), ebook: t('product.type_ebook'), audio: t('product.type_audio'),
    video: t('product.type_video'), course: t('product.type_course'), link: t('product.type_link'),
  };

  // placeholder — hook moved after orgId

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', productId || productSlug],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, description, banner_url, is_verified, kyc_status, category)');
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

  // Fetch org page settings for theme colors + org-level pixels
  const orgId = product?.organization_id;
  const { affiliateCode, ensureAffiliateCode } = useAutoAffiliateCode(orgId);
  const { data: pageSettings } = useQuery({
    queryKey: ['org-page-settings-product', orgId],
    queryFn: async () => {
      const { data } = await db
        .from('org_page_settings')
        .select('theme_primary_color, theme_accent_color, facebook_pixel_id, tiktok_pixel_id, google_tag_id')
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
  const shouldAutoOpenPreview = searchParams.get('preview') === '1';
  const canQuickPreview = !!(product as any)?.file_url && ['pdf', 'ebook'].includes(((product as any)?.product_type || '').toLowerCase());
  
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

  // Auto-scroll to reviews section when arriving from email link with #reviews
  useEffect(() => {
    if (product && window.location.hash === '#reviews') {
      setTimeout(() => {
        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [product]);

  const buildShareUrl = (refCode?: string | null) => {
    const pSlug = (product as any)?.slug;
    const basePath = pSlug ? `/org/${slug}/p/${pSlug}` : `/org/${slug}/product/${product?.id}`;
    let url = `https://siteviral.com${basePath}`;
    const code = refCode ?? affiliateCode;
    if (code) url += `?ref=${code}`;
    return url;
  };

  const getResolvedShareUrl = async () => {
    const pSlug = (product as any)?.slug;
    const basePath = pSlug ? `/org/${slug}/p/${pSlug}` : `/org/${slug}/product/${product?.id}`;

    if (!basePath) return null;

    let targetPath = basePath;
    if (user) {
      const code = affiliateCode ?? await ensureAffiliateCode();
      if (code) {
        targetPath = `${basePath}?ref=${code}`;
      }
      // If no code, share without affiliate ref (no commission but still works)
    }

    try {
      return await getOrCreateShortLink({
        targetPath,
        title: product?.title || 'Produit Siteviral',
        description: stripHtml(product?.description || '').slice(0, 155) || '',
        image: product?.cover_image_url || undefined,
      });
    } catch {
      return buildSocialShareUrl({
        targetUrl: `https://siteviral.com${targetPath}`,
        title: product?.title || 'Produit Siteviral',
        description: stripHtml(product?.description || '').slice(0, 155) || '',
        image: product?.cover_image_url || undefined,
      });
    }
  };

  const handleCopyLink = async () => {
    const url = await getResolvedShareUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: t('product.link_copied') });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = async () => {
    const url = await getResolvedShareUrl();
    if (!url) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${product?.title} — ${url}`)}`, '_blank');
  };

  const handleShare = async () => {
    const url = await getResolvedShareUrl();
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ title: product?.title, url });
    } else {
      await handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl py-8 px-4">
          <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_340px] gap-8">
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
      <PixelInjector
        facebookPixelId={(product as any).facebook_pixel_id || (pageSettings as any)?.facebook_pixel_id}
        tiktokPixelId={(product as any).tiktok_pixel_id || (pageSettings as any)?.tiktok_pixel_id}
        googleTagId={(product as any).google_tag_id || (pageSettings as any)?.google_tag_id}
      />
      <ReadingProgressBar />
      <SEOHead
        title={`${product.title} — ${org?.name || 'Siteviral'}`}
        description={stripHtml(product.description || '').slice(0, 155) || `Achetez ${product.title} sur Siteviral — ${product.is_free ? 'Gratuit' : `${product.price} ${product.currency || 'XOF'}`}. Paiement Mobile Money & Carte.`}
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
                    toast({ title: locale === 'fr' ? '✅ Produit publié !' : '✅ Product published!', description: locale === 'fr' ? 'Votre produit est maintenant visible par tous.' : 'Your product is now visible to everyone.' });
                    window.location.reload();
                  } else {
                    toast({ title: locale === 'fr' ? 'Erreur' : 'Error', description: error.message, variant: 'destructive' });
                  }
                }}
              >
                <Eye className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Publier' : 'Publish'}
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
              <Pencil className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Modifier ce produit' : 'Edit product'}
            </Button>
          </div>
        </div>
      )}

      {/* Unified sticky header — org logo + back button (replaces separate breadcrumb + banner on mobile) */}
      <div
        className="sticky top-0 md:top-14 z-20 border-b bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between"
        style={topBarStyle}
      >
        {org ? (
          <Link to={`/org/${slug}`} className="flex items-center gap-2.5 min-w-0">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-7 w-7 rounded-lg object-cover shrink-0" />
            ) : (
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0"
                style={{ backgroundColor: orgPrimary || 'hsl(var(--primary))' }}
              >
                {org.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold truncate max-w-[180px]">{org.name}</span>
            {isOrgVerifiedOrKyc(org.is_verified, (org as any).kyc_status) && <VerifiedBadge size="sm" label={getVerifiedLabel((org as any).category, locale)} className="ml-1" />}
          </Link>
        ) : (
          <Link to={user ? '/discover' : '/'}>
            <SiteLogo size="sm" linked={false} animate />
          </Link>
        )}
        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs hidden sm:inline-flex"
              onClick={() => navigate(`/admin/products/${product.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Org-branded banner — desktop only (mobile gets clean sticky header above) */}
      {org && (
        <div className="hidden md:block relative border-b border-border/30 overflow-hidden" style={bannerBg}>
          {!orgPrimary && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10" />
          )}
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
                <p className="font-bold text-sm flex items-center gap-1">{org.name} {isOrgVerifiedOrKyc(org.is_verified, (org as any).kyc_status) && <VerifiedBadge size="sm" label={getVerifiedLabel((org as any).category, locale)} />}</p>
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
        </div>
      )}

      {/* Breadcrumb — desktop only */}
      <div className="hidden md:block container max-w-5xl px-4 pt-4">
        <Breadcrumb items={[
          { label: org?.name || 'Organisation', href: `/org/${slug}` },
          { label: product.title },
        ]} />
      </div>

      <div className="container max-w-5xl px-4 py-6 pb-24 md:pb-6">
        <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_340px] gap-6 md:gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <ProductImageGallery
              coverImage={product.cover_image_url}
              previewImages={(product as any).preview_images}
              title={product.title}
              aspectClass={aspectClass}
            />

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
              autoOpen={shouldAutoOpenPreview}
              onRequestClose={() => {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('preview');
                setSearchParams(nextParams, { replace: true });
              }}
            />

            <div className="md:hidden space-y-3">
              <h1 className="text-2xl font-bold"><ExperimentTitle defaultTitle={product.title} /></h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs capitalize gap-1">
                  {typeIcons[product.product_type || 'pdf']} {typeLabels[product.product_type || 'pdf'] || product.product_type}
                </Badge>
                {product.sales_count && product.sales_count > 0 && (
                  <span className="text-xs text-muted-foreground">{product.sales_count}+ {t('product.sales')}</span>
                )}
              </div>

              {/* Price visible on mobile — always shown for screenshots & quick info */}
              <div className="flex items-center gap-2 flex-wrap">
                {(product as any).is_pwyw && !product.is_free ? (
                  <span className="text-lg font-bold text-primary">
                    💰 {locale === 'fr' ? 'Prix libre' : 'Name your price'}
                    {((product as any).min_price || 0) > 0 && (
                      <span className="text-sm font-medium text-muted-foreground ml-1">
                        · {locale === 'fr' ? 'Dès' : 'From'} {formatPrice((product as any).min_price, false, product.currency)}
                      </span>
                    )}
                  </span>
                ) : (
                  <>
                    {(() => {
                      const effectiveP = getEffectivePrice(product as any);
                      const hasDiscount = !product.is_free && (product as any).sale_price != null && (product as any).sale_price > 0 && (product as any).sale_price < (product.price || 0) && (!(product as any).sale_ends_at || new Date((product as any).sale_ends_at) > new Date());
                      return (
                        <>
                          <span className={cn('text-xl font-bold', product.is_free ? 'text-emerald-500' : 'text-primary')}>
                            {formatPrice(effectiveP, product.is_free, product.currency)}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.price || 0, false, product.currency)}
                              </span>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                                -{Math.round((((product.price || 0) - (product as any).sale_price) / (product.price || 1)) * 100)}%
                              </Badge>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            <ProductMainContentExtras
              product={{ ...product, _bundleItems: bundleItems }}
              slug={slug || ''}
              isPurchased={isPurchased}
              canManage={!!canManage}
              locale={locale}
              t={t}
            />

          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:sticky md:top-[6.5rem] md:self-start space-y-4 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto scrollbar-hide">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-card space-y-4">
              <div className="hidden md:block space-y-2">
                <h1 className="text-xl font-bold leading-snug"><ExperimentTitle defaultTitle={product.title} /></h1>
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
                {(product as any).is_pwyw && !product.is_free ? (
                  <div className="space-y-1">
                    <span className="text-lg font-semibold text-primary">
                      💰 {locale === 'fr' ? 'Prix libre' : 'Name your price'}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'fr' ? 'À partir de' : 'Starting from'}{' '}
                      <span className="font-bold text-foreground">
                        {formatPrice((product as any).min_price || 0, false, product.currency)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <>
                    <span className={cn('text-3xl font-bold', product.is_free ? 'text-emerald-500' : 'text-primary')}>
                      {formatPrice(product.price || 0, product.is_free, product.currency)}
                    </span>
                    {!product.is_free && (product.price ?? 0) > 0 && (
                      <div className="mt-0.5">
                        <LocalPriceHint amount={product.price ?? 0} currency={product.currency || 'XOF'} className="text-xs" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Social Proof */}
              <SocialProofWidget
                salesCount={product.sales_count || 0}
                reviewCount={(product as any).review_count || 0}
                averageRating={(product as any).average_rating || 0}
              />

              {/* Urgency — hidden when PWYW is active or no valid sale price */}
              {!(product as any).is_pwyw && (product as any).sale_price > 0 && (
                <UrgencyWidget
                  saleEndsAt={(product as any).sale_ends_at}
                  salesCount={product.sales_count || 0}
                  isFree={product.is_free || false}
                />
              )}

              {/* Content size */}
              <ContentSizeBadge
                pageCount={(product as any).page_count}
                productType={product.product_type || undefined}
              />

              {canQuickPreview && (
                <Button
                  variant="outline"
                  className="w-full h-11 gap-2"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set('preview', '1');
                    setSearchParams(nextParams);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Aperçu gratuit
                </Button>
              )}

              <SmartCTA
                product={product}
                isPurchased={isPurchased}
                onBuy={() => {
                  if (!user) { navigate(`/auth?returnTo=${encodeURIComponent(buildShareUrl())}`); return; }
                  setPurchaseProduct(product as DigitalProduct);
                }}
                onAccess={() => navigate('/my-purchases')}
              />

              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ShareButtons
                      url={buildShareUrl()}
                      resolveUrl={getResolvedShareUrl}
                      title={product.title}
                      description={stripHtml(product.description || '').slice(0, 120) || ''}
                      compact
                    />
                  </div>
                  <WishlistButton productId={product.id} variant="full" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-[11px] font-semibold"
                    onClick={async () => {
                      if (user && !affiliateCode) await ensureAffiliateCode();
                      setFlyerOpen(true);
                    }}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {isFr ? 'Créer un visuel à partager' : 'Create a shareable flyer'}
                  </Button>
                  <PrintableQRCode
                    productTitle={product.title}
                    productUrl={buildShareUrl()}
                    coverImageUrl={(product as any).cover_image_url || (product as any).cover_url}
                    orgName={org?.name}
                    orgAvatarUrl={(org as any)?.logo_url}
                    price={getEffectivePrice(product as any) as number}
                    currency={(product as any).currency}
                  />
                </div>

                <FlyerDialog
                  open={flyerOpen}
                  onOpenChange={setFlyerOpen}
                  title={product.title}
                  author={org?.name}
                  benefit={truncateWords(stripHtml(product.description || ''), 140) || null}
                  priceLabel={formatPrice(getEffectivePrice(product as any) as number, (product as any).is_free, (product as any).currency, locale)}
                  coverUrl={(product as any).cover_image_url || (product as any).cover_url}
                  orgName={org?.name}
                  orgAvatarUrl={(org as any)?.logo_url}
                  link={buildShareUrl()}
                />

                {user && (
                  <button
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="h-3 w-3" />
                    {isFr ? 'Signaler ce contenu' : 'Report this content'}
                  </button>
                )}
              </div>

              <ReportContentDialog
                open={reportOpen}
                onOpenChange={setReportOpen}
                contentId={product.id}
                contentType="product"
                contentTitle={product.title}
                organizationId={product.organization_id}
              />
            </div>

            <ContactSellerWidget
              organizationId={product.organization_id}
              orgName={org?.name}
              orgLogoUrl={org?.logo_url}
              productId={product.id}
              productTitle={product.title}
            />


            <ProductSidebarExtras
              product={product}
              org={org}
              slug={slug || ''}
              isPurchased={isPurchased}
              locale={locale}
              orgPrimary={orgPrimary}
              buildShareUrl={() => buildShareUrl()}
            />
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
                  hideCommission
                  hideShare
                />
              ))}
            </div>
          </div>
        )}

        {/* Cross-sell: Buyers also purchased */}
        <CrossSellWidget
          productId={product.id}
          organizationId={product.organization_id}
          productType={product.product_type}
        />

        {/* Subscription upsell for repeat buyers */}
        <SubscriptionUpsellPrompt
          organizationId={product.organization_id}
          organizationSlug={slug}
          organizationName={product.organizations?.name}
        />
      </div>

      {/* Mobile sticky buy bar (StickyBuyBar component handles visibility) */}

      <ProductPurchaseModal
        product={purchaseProduct}
        organizationId={product.organization_id}
        open={!!purchaseProduct}
        onClose={() => setPurchaseProduct(null)}
        onSuccess={() => {
          setPurchaseProduct(null);
          setShowCelebration(true);
        }}
      />

      <PostPurchaseCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        productTitle={product.title}
        organizationId={product.organization_id}
        orgName={org?.name || ''}
        orgSlug={slug || ''}
        productSlug={(product as any)?.slug}
        productId={product.id}
        coverImageUrl={product.cover_image_url}
        isFreePurchase={product.is_free || false}
        productType={product.product_type || undefined}
        price={getEffectivePrice(product as any)}
        commissionRate={(product as any).commission_rate ?? (product as any).commission_percent ?? (org as any)?.affiliation_commission_percent ?? 20}
        onGoToResources={() => { setShowCelebration(false); navigate('/my-purchases'); }}
      />

      {/* Mobile sticky buy bar */}
      <StickyBuyBar
        title={product.title}
        price={product.price || 0}
        isFree={product.is_free || false}
        currency={product.currency || 'XOF'}
        isPurchased={isPurchased}
        salePrice={(product as any).sale_price}
        onBuy={() => {
          if (!user) { navigate(`/auth?returnTo=${encodeURIComponent(buildShareUrl())}`); return; }
          setPurchaseProduct(product as DigitalProduct);
        }}
        onAccess={() => navigate('/my-purchases')}
      />
    </div>
  );
}
