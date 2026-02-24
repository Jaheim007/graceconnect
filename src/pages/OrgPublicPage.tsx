import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrgBySlug, useUpdateOrg } from '@/hooks/useOrganizations';
import { useMyPurchases } from '@/hooks/usePurchases';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { MediaCard } from '@/components/media/MediaCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';
import { DonateModal } from '@/components/donations/DonateModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { FormattedText } from '@/lib/formatText';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { InlineEditableText } from '@/components/org/InlineEditableText';
import { OrgAdminToolbar } from '@/components/org/OrgAdminToolbar';
import { OrgPageTour } from '@/components/org/OrgPageTour';
import { useOrgPageSettings } from '@/hooks/useOrgPageSettings';
import { supabase } from '@/integrations/supabase/client';
import {
  Globe, MessageCircle, CheckCircle2, Users, CalendarDays,
  Share2, ShoppingBag, Heart, Camera, MapPin, ArrowLeft, MoreHorizontal,
  Home, Play, Pencil, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DonationCampaign, DigitalProduct } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useAffiliateCapture } from '@/hooks/useAffiliateCapture';
import { PhotoLightbox } from '@/components/photos/PhotoLightbox';
import { PixelInjector } from '@/components/org/PixelInjector';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { OrgBadges } from '@/components/org/OrgBadges';
import { SmartPopup } from '@/components/org/SmartPopup';
import { WaitlistWidget } from '@/components/org/WaitlistWidget';
import { useWaitlists } from '@/hooks/useWaitlists';
import { SubscriptionPlansWidget } from '@/components/subscriptions/SubscriptionPlansWidget';

export default function OrgPublicPage() {
  useAffiliateCapture();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { joinOrg, leaveOrg, isMemberOf, canManage } = useOrg();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const updateOrg = useUpdateOrg();
  const [joining, setJoining] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState<DonationCampaign | null>(null);
  const [purchaseProduct, setPurchaseProduct] = useState<DigitalProduct | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  // Image upload refs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const hasAffiliateRef = !!searchParams.get('ref');
  const pathTab = pathname.split('/').pop();
  const defaultTab = hasAffiliateRef && !['content', 'events', 'store', 'donate', 'photos'].includes(pathTab || '')
    ? 'store'
    : 'home';
  const activeTab = ['content', 'events', 'store', 'donate', 'photos'].includes(pathTab || '') ? pathTab! : defaultTab;

  const { data: org, isLoading: orgLoading } = useOrgBySlug(slug);
  const { data: media = [] } = useOrgMedia(org?.id);
  const { data: announcements = [] } = useOrgAnnouncements(org?.id);
  const { data: events = [] } = useOrgEvents(org?.id);
  const { data: campaigns = [] } = useOrgCampaigns(org?.id);
  const { data: products = [] } = useOrgProducts(org?.id);
  const { data: photos = [] } = useQuery({
    queryKey: ['org-photos-public', org?.id],
    queryFn: async () => {
      if (!org?.id) return [];
      const { data } = await db
        .from('org_photos')
        .select('*')
        .eq('organization_id', org.id)
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      return data || [];
    },
    enabled: !!org?.id,
  });
  const { data: purchases = [] } = useMyPurchases();
  const purchasedProductIds = new Set(purchases.map(p => p.product_id));
  const { data: pageSettings } = useOrgPageSettings(org?.id);
  const { data: waitlists = [] } = useWaitlists(org?.id);

  // Apply custom theme colors from page settings
  const customPrimary = pageSettings?.theme_primary_color;
  const customAccent = pageSettings?.theme_accent_color;
  const themeStyle = (customPrimary || customAccent) ? {
    '--primary': customPrimary || undefined,
    '--accent': customAccent || undefined,
    '--ring': customPrimary || undefined,
    '--primary-foreground': '0 0% 100%',
    '--sidebar-primary': customPrimary || undefined,
  } as React.CSSProperties : undefined;

  // Tracking pixels
  const fbPixel = (pageSettings as any)?.facebook_pixel_id;
  const ttPixel = (pageSettings as any)?.tiktok_pixel_id;
  const gTagId = (pageSettings as any)?.google_tag_id;

  const { data: memberCount = 0 } = useQuery({
    queryKey: ['org-member-count', org?.id],
    queryFn: async () => {
      if (!org?.id) return 0;
      const { count } = await db
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);
      return count || 0;
    },
    enabled: !!org?.id,
  });

  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';

  // Admin check
  const isAdmin = org ? canManage(org.id) : false;
  const isOwner = org ? org.owner_id === user?.id : false;

  // Inline edit save handler
  const saveOrgField = async (field: string, value: string) => {
    if (!org) return;
    await updateOrg.mutateAsync({ id: org.id, updates: { [field]: value } });
    qc.invalidateQueries({ queryKey: ['org-by-slug', slug] });
    toast({ title: locale === 'fr' ? 'Modifié ✓' : 'Updated ✓' });
  };

  // Image upload handler
  const handleImageUpload = async (file: File, field: 'banner_url' | 'logo_url', setUploading: (b: boolean) => void) => {
    if (!org || !file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: 'Max 10MB', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${org.id}/${field}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('org-uploads').upload(fileName, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('org-uploads').getPublicUrl(fileName);
      await updateOrg.mutateAsync({ id: org.id, updates: { [field]: data.publicUrl } });
      qc.invalidateQueries({ queryKey: ['org-by-slug', slug] });
      toast({ title: locale === 'fr' ? 'Image mise à jour ✓' : 'Image updated ✓' });
    } catch (err: any) {
      toast({ title: err.message || 'Upload failed', variant: 'destructive' });
    }
    setUploading(false);
  };

  const toggleAffiliation = async () => {
    if (!org) return;
    const newVal = !(org as any).affiliation_enabled;
    await updateOrg.mutateAsync({ id: org.id, updates: { affiliation_enabled: newVal } as any });
    qc.invalidateQueries({ queryKey: ['org-by-slug', slug] });
    toast({ title: newVal ? (locale === 'fr' ? 'Affiliation activée' : 'Affiliation enabled') : (locale === 'fr' ? 'Affiliation désactivée' : 'Affiliation disabled') });
  };

  if (orgLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="h-56 rounded-2xl skeleton-shimmer mb-4" />
        <SkeletonList count={6} />
      </div>
    );
  }

  if (!org) {
    return (
      <EmptyState
        title={t('org_public.not_found')}
        description={t('org_public.not_found_desc')}
        action={{ label: t('org_public.explore'), onClick: () => navigate('/discover') }}
        className="min-h-screen"
      />
    );
  }

  const isMember = isMemberOf(org.id);
  const orgAny = org as any;

  const handleJoinLeave = async () => {
    if (!user) { navigate('/auth'); return; }
    setJoining(true);
    if (isMember) {
      await leaveOrg(org.id);
      toast({ title: `${t('org_public.left')} ${org.name}` });
    } else {
      await joinOrg(org.id);
      toast({ title: `${t('org_public.joined')} ${org.name} !` });
      navigate('/feed');
    }
    setJoining(false);
  };

  const shareWhatsApp = () => {
    const msg = locale === 'fr'
      ? `Découvrez ${org.name} sur Siteviral: ${window.location.href}`
      : `Discover ${org.name} on Siteviral: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const pinnedAnnouncement = announcements.find((a) => a.is_pinned);

  const navigateTab = (tab: string) => {
    const base = `/org/${slug}`;
    navigate(tab === 'home' ? base : `${base}/${tab}`);
  };

  // Section ordering & visibility
  const sectionOrder = pageSettings?.section_order || ['products', 'campaigns', 'content', 'photos', 'events'];
  const hiddenSections = new Set(pageSettings?.hidden_sections || []);

  const sectionData: Record<string, { items: any[]; render: () => JSX.Element | null }> = {
    products: {
      items: products,
      render: () => products.length > 0 ? (
        <section key="products">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-primary" /> {t('org_public.digital_products')}
            </h2>
            {products.length > 3 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('store')}>
                {t('org_public.view_all')}
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onPurchase={() => setPurchaseProduct(p)} isPurchased={purchasedProductIds.has(p.id)} />
            ))}
          </div>
        </section>
      ) : null,
    },
    campaigns: {
      items: campaigns,
      render: () => campaigns.length > 0 ? (
        <section key="campaigns">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-destructive" /> {t('org_public.active_campaigns')}
            </h2>
            {campaigns.length > 2 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('donate')}>
                {t('org_public.view_all')}
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {campaigns.slice(0, 2).map((c, i) => (
              <CampaignCard key={c.id} campaign={c} index={i} onDonate={() => setDonateCampaign(c)} />
            ))}
          </div>
        </section>
      ) : null,
    },
    content: {
      items: media,
      render: () => media.length > 0 ? (
        <section key="content">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">{t('org_public.featured_content')}</h2>
            {media.length > 3 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('content')}>
                {t('org_public.view_all')}
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {media.slice(0, 3).map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
          </div>
        </section>
      ) : null,
    },
    photos: {
      items: photos,
      render: () => photos.length > 0 ? (
        <section key="photos">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-primary" /> {t('org_public.photos')}
            </h2>
            {photos.length > 4 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('photos')}>
                {t('org_public.view_all')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {photos.slice(0, 4).map((photo: any, i: number) => (
              <div key={photo.id} className="rounded-xl overflow-hidden group cursor-pointer aspect-[4/3]" onClick={() => setLightboxIndex(i)}>
                <img src={photo.image_url} alt={photo.caption || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </section>
      ) : null,
    },
    events: {
      items: events,
      render: () => events.length > 0 ? (
        <section key="events">
          <h2 className="font-semibold mb-3 text-sm">{t('org_public.upcoming_events')}</h2>
          <div className="space-y-2">
            {events.slice(0, 3).map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.event_date ? new Date(ev.event_date).toLocaleDateString(dateFmt) : t('org_public.date_tbc')}</p>
                </div>
                {ev.location && <span className="text-xs text-muted-foreground hidden sm:block">{ev.location}</span>}
              </div>
            ))}
          </div>
        </section>
      ) : null,
    },
  };

  const orderedSections = sectionOrder
    .filter(s => !hiddenSections.has(s) && sectionData[s])
    .map(s => sectionData[s].render())
    .filter(Boolean);

  // Add subscription plans after ordered sections
  const subscriptionSection = org?.id ? (
    <section key="subscriptions">
      <SubscriptionPlansWidget orgId={org.id} currency={org.currency || 'XOF'} />
    </section>
  ) : null;

  const hasAnyContent = Object.values(sectionData).some(s => s.items.length > 0);

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      <PixelInjector facebookPixelId={fbPixel} tiktokPixelId={ttPixel} googleTagId={gTagId} />
      <SEOHead
        title={`${org.name} — Siteviral`}
        description={org.description || (locale === 'fr' ? `Découvrez ${org.name} sur Siteviral` : `Discover ${org.name} on Siteviral`)}
        ogImage={org.banner_url || org.logo_url}
        canonicalUrl={`https://siteviral.com/org/${slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: org.name,
          description: org.description,
          url: `https://siteviral.com/org/${slug}`,
          image: org.logo_url,
        }}
      />

      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between">
        <Link to={user ? '/feed' : '/'}>
          <span className="text-lg font-extrabold tracking-tight italic text-primary">Siteviral</span>
        </Link>
        {!user ? (
          <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground" onClick={() => navigate('/auth')}>
            {t('org_public.login')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-4 w-4" /> {t('org_public.back')}
          </Button>
        )}
      </div>

      {/* Affiliate referral banner */}
      {hasAffiliateRef && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
          <p className="text-xs text-primary font-medium">
            {t('org_public.invited_explore')} {org.name} {t('org_public.browse_below')}
          </p>
        </div>
      )}

      {/* ─── BANNER ─── */}
      <div className="relative">
        <div
          className={cn(
            "h-32 sm:h-56 lg:h-72 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20",
            isAdmin && "cursor-pointer group"
          )}
          onClick={() => isAdmin && bannerInputRef.current?.click()}
        >
          {org.banner_url ? (
            <img src={org.banner_url} alt={org.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full hero-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          {isAdmin && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              {uploadingBanner ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <div className="bg-black/50 text-white rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> {locale === 'fr' ? 'Modifier la bannière' : 'Edit banner'}
                </div>
              )}
            </div>
          )}
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImageUpload(f, 'banner_url', setUploadingBanner);
            e.target.value = '';
          }}
        />

        <div className="container max-w-5xl relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 sm:-mt-12 pb-4">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                "h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-4 border-background shadow-elevated overflow-hidden bg-card shrink-0 relative",
                isAdmin && "cursor-pointer group"
              )}
              onClick={() => isAdmin && logoInputRef.current?.click()}
            >
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-primary-foreground">
                    {org.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              {isAdmin && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-2xl">
                  {uploadingLogo ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Pencil className="h-5 w-5 text-white" />
                  )}
                </div>
              )}
            </motion.div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f, 'logo_url', setUploadingLogo);
                e.target.value = '';
              }}
            />

            <div className="flex-1 min-w-0 sm:pb-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <InlineEditableText
                    value={org.name}
                    onSave={(v) => saveOrgField('name', v)}
                    canEdit={isAdmin}
                    tag="h1"
                    className="text-2xl sm:text-3xl font-bold truncate"
                  />
                  {org.is_verified && <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />}
                </div>
                <OrgBadges isVerified={org.is_verified} kycStatus={orgAny.kyc_status} isSuspended={orgAny.is_suspended} size="sm" className="mt-1" />
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs capitalize">{org.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {memberCount} {memberCount !== 1 ? t('org_public.members_plural') : t('org_public.members')}
                  </span>
                  {org.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {org.country}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ─── ANIMATED STATS BAR ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 mt-4 mb-2"
            >
              {products.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{products.length}</span>
                  <span className="text-xs text-muted-foreground">{locale === 'fr' ? 'Produits' : 'Products'}</span>
                </div>
              )}
              {media.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <Play className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{media.length}</span>
                  <span className="text-xs text-muted-foreground">{locale === 'fr' ? 'Contenus' : 'Content'}</span>
                </div>
              )}
              {events.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{events.length}</span>
                  <span className="text-xs text-muted-foreground">{locale === 'fr' ? 'Événements' : 'Events'}</span>
                </div>
              )}
              {photos.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <Camera className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{photos.length}</span>
                  <span className="text-xs text-muted-foreground">Photos</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 sm:pb-1"
            >
              {org.whatsapp && (
                <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs">
                  <a href={`https://wa.me/${org.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={shareWhatsApp} className="h-9 gap-1.5 text-xs">
                <Share2 className="h-4 w-4" /> {t('org_public.share')}
              </Button>
              {isMember ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 text-xs px-3">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleJoinLeave} className="text-destructive focus:text-destructive text-xs">
                      {t('org_public.leave')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  onClick={handleJoinLeave}
                  disabled={joining}
                  className="h-9 text-xs px-5 bg-primary text-primary-foreground"
                >
                  {joining ? '...' : t('org_public.join')}
                </Button>
              )}
            </motion.div>
          </div>

          {/* Description - inline editable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="max-w-3xl mb-2 overflow-hidden"
          >
            {isAdmin ? (
              <InlineEditableText
                value={org.description || ''}
                onSave={(v) => saveOrgField('description', v)}
                canEdit={true}
                multiline
                className="text-sm text-muted-foreground break-words leading-relaxed"
                placeholder={locale === 'fr' ? 'Ajoutez une description...' : 'Add a description...'}
              />
            ) : org.description ? (
              <FormattedText text={org.description} className="text-sm text-muted-foreground break-words leading-relaxed" />
            ) : null}
          </motion.div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            {org.website && (
              <a href={org.website} className="flex items-center gap-1.5 text-xs text-primary hover:underline" target="_blank" rel="noreferrer">
                <Globe className="h-3.5 w-3.5" /> {org.website.replace(/https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-5xl">
        {/* ─── LEADER BIOGRAPHY ─── */}
        {(orgAny.leader_name || isAdmin) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8 p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-card"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">{t('org_public.leader_bio')}</h2>
            <div className="flex flex-col sm:flex-row gap-5">
              {orgAny.leader_image_url && (
                <div className="shrink-0">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-elevated">
                    <img src={orgAny.leader_image_url} alt={orgAny.leader_name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <InlineEditableText
                  value={orgAny.leader_name || ''}
                  onSave={(v) => saveOrgField('leader_name', v)}
                  canEdit={isAdmin}
                  tag="h3"
                  className="text-lg sm:text-xl font-bold"
                  placeholder={locale === 'fr' ? 'Nom du leader...' : 'Leader name...'}
                />
                <InlineEditableText
                  value={orgAny.leader_title || ''}
                  onSave={(v) => saveOrgField('leader_title', v)}
                  canEdit={isAdmin}
                  tag="p"
                  className="text-sm text-primary font-medium mt-0.5"
                  placeholder={locale === 'fr' ? 'Titre...' : 'Title...'}
                />
                {isAdmin ? (
                  <InlineEditableText
                    value={orgAny.leader_bio || ''}
                    onSave={(v) => saveOrgField('leader_bio', v)}
                    canEdit={true}
                    multiline
                    className="text-sm text-muted-foreground mt-2 leading-relaxed break-words"
                    placeholder={locale === 'fr' ? 'Biographie...' : 'Biography...'}
                  />
                ) : orgAny.leader_bio ? (
                  <FormattedText text={orgAny.leader_bio} className="text-sm text-muted-foreground mt-2 leading-relaxed break-words" />
                ) : null}
              </div>
            </div>
          </motion.section>
        )}

        {/* Pinned announcement */}
        {pinnedAnnouncement && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs">📌</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{pinnedAnnouncement.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{pinnedAnnouncement.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={navigateTab} className="w-full">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
            {[
              { value: 'home', label: t('org_public.home'), icon: Home, count: null },
              ...(products.length > 0 || isAdmin ? [{ value: 'store', label: t('org_public.store'), icon: ShoppingBag, count: products.length }] : []),
              ...(campaigns.length > 0 || isAdmin ? [{ value: 'donate', label: t('org_public.donations'), icon: Heart, count: campaigns.length }] : []),
              ...(media.length > 0 || isAdmin ? [{ value: 'content', label: t('org_public.content'), icon: Play, count: media.length }] : []),
              ...(photos.length > 0 || isAdmin ? [{ value: 'photos', label: t('org_public.photos'), icon: Camera, count: photos.length }] : []),
              ...(events.length > 0 || isAdmin ? [{ value: 'events', label: t('org_public.events'), icon: CalendarDays, count: events.length }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => navigateTab(tab.value)}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all border',
                    activeTab === tab.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 bg-card'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count !== null && <span className="text-[10px] opacity-70">({tab.count})</span>}
                </button>
              );
            })}
          </div>

          {/* ─── HOME TAB ─── */}
          <TabsContent value="home" className="space-y-8">
            {orderedSections}
            {subscriptionSection}

            {/* Waitlists */}
            {(waitlists as any[]).filter(w => w.is_active).length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-sm">🚀 Bientôt disponible</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(waitlists as any[]).filter(w => w.is_active).map(w => (
                    <WaitlistWidget key={w.id} waitlist={w} />
                  ))}
                </div>
              </div>
            )}

            {!hasAnyContent && (waitlists as any[]).filter(w => w.is_active).length === 0 && (
              <EmptyState variant="content" description={t('org_public.no_content')} />
            )}
          </TabsContent>

          {/* ─── STORE TAB ─── */}
          <TabsContent value="store">
            {products.length === 0 ? (
              <EmptyState variant="purchases" description={t('org_public.no_products_desc')} />
            ) : (
              <>
                <div className="mb-4 p-4 rounded-2xl bg-primary/8 border border-primary/20 flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">{t('org_public.store_info')}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onPurchase={() => setPurchaseProduct(p)} isPurchased={purchasedProductIds.has(p.id)} />)}
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── DONATE TAB ─── */}
          <TabsContent value="donate">
            {campaigns.length === 0 ? (
              <EmptyState variant="campaigns" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {campaigns.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={i} onDonate={() => setDonateCampaign(c)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── CONTENT TAB ─── */}
          <TabsContent value="content">
            {media.length === 0 ? (
              <EmptyState variant="content" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {media.map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
              </div>
            )}
          </TabsContent>

          {/* ─── EVENTS TAB ─── */}
          <TabsContent value="events">
            {events.length === 0 ? (
              <EmptyState variant="generic" title={t('org_public.no_events')} description={t('org_public.no_events_desc')} />
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-2xl border border-border bg-card shadow-card">
                    {ev.image_url && (
                      <div className="h-40 rounded-xl overflow-hidden mb-3">
                        <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-semibold">{ev.title}</h3>
                    {ev.description && <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>}
                    <div className="flex gap-4 mt-2">
                      {ev.event_date && <span className="text-xs text-muted-foreground">{new Date(ev.event_date).toLocaleDateString(dateFmt, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                      {ev.location && <span className="text-xs text-primary">{ev.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── PHOTOS TAB ─── */}
          <TabsContent value="photos">
            {photos.length === 0 ? (
              <EmptyState variant="generic" title={t('org_public.no_photos')} description={t('org_public.no_photos_desc')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo: any, i: number) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl overflow-hidden bg-card border border-border shadow-card hover:shadow-elevated transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => setLightboxIndex(i)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={photo.image_url} alt={photo.caption || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white/90 line-clamp-2">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Admin toolbar - only for org managers */}
      {isAdmin && org && (
        <OrgAdminToolbar
          orgId={org.id}
          orgSlug={org.slug}
          isOwner={isOwner}
          affiliationEnabled={!!orgAny.affiliation_enabled}
          pageSettings={pageSettings || null}
          onStartTour={() => setTourOpen(true)}
          onToggleAffiliation={toggleAffiliation}
        />
      )}

      {/* Interactive tour */}
      <OrgPageTour open={tourOpen} onClose={() => setTourOpen(false)} />

      <DonateModal
        campaign={donateCampaign}
        organizationId={org?.id ?? ''}
        open={!!donateCampaign}
        onClose={() => setDonateCampaign(null)}
      />

      <ProductPurchaseModal
        product={purchaseProduct}
        organizationId={org?.id ?? ''}
        open={!!purchaseProduct}
        onClose={() => setPurchaseProduct(null)}
      />

      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />

      {/* Smart Popup */}
      {pageSettings?.popup_config && (pageSettings.popup_config as any)?.enabled && (
        <SmartPopup config={pageSettings.popup_config as any} orgName={org.name} />
      )}
    </div>
  );
}
