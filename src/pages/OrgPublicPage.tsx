import { useState, useRef } from 'react';
import { stripHtml } from '@/lib/formatText';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useOrgBySlug } from '@/hooks/useOrganizations';
import { useMyPurchases } from '@/hooks/usePurchases';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { useOrgPrograms } from '@/hooks/usePrograms';
import { useOrgOfferings, Offering } from '@/hooks/useOfferings';
import { MediaCard } from '@/components/media/MediaCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';
import { DonateModal } from '@/components/donations/DonateModal';
import { OfferingModal } from '@/components/offerings/OfferingModal';
import { OfferingCard } from '@/components/offerings/OfferingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useOrgPageSettings } from '@/hooks/useOrgPageSettings';
import { OrgAdminToolbar } from '@/components/org/OrgAdminToolbar';
import { OrgPageTour } from '@/components/org/OrgPageTour';
import { OrgPublicHeader } from '@/components/org/OrgPublicHeader';
import { OrgHomeSections } from '@/components/org/OrgHomeSections';
import { PixelInjector } from '@/components/org/PixelInjector';
import { SEOHead } from '@/components/seo/SEOHead';
import { DynamicFavicon } from '@/components/seo/DynamicFavicon';
import { SmartPopup } from '@/components/org/SmartPopup';
import { WaitlistWidget } from '@/components/org/WaitlistWidget';
import { SubscriptionPlansWidget } from '@/components/subscriptions/SubscriptionPlansWidget';
import { PhotoLightbox } from '@/components/photos/PhotoLightbox';
import { useAffiliateCapture } from '@/hooks/useAffiliateCapture';
import { PoweredBySiteViral } from '@/components/billing/PoweredBySiteViral';
import { useWaitlists } from '@/hooks/useWaitlists';
import { isMainPlatformDomain } from '@/hooks/useDomainResolver';
import { DonationCampaign, DigitalProduct } from '@/types/database';
import { cn } from '@/lib/utils';
import { computeHiddenSections, isFeatureEnabledForPublic } from '@/lib/siteviral/publicSections';
import { useOrgReadiness } from '@/hooks/useOrgReadiness';
import { Eye, EyeOff } from 'lucide-react';
import {
  Home, ShoppingBag, Heart, Play, Camera, CalendarDays, HandHeart, Plus, ChevronDown, ChevronUp, Settings, GraduationCap, ExternalLink, MapPin
} from 'lucide-react';
import { EventCountdown } from '@/components/events/EventCountdown';
import React, { useCallback } from 'react';

export default function OrgPublicPage() {
  useAffiliateCapture();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { canManage, setCurrentOrg, userOrgs, currentOrg } = useOrg();
  const { t, locale } = useI18n();

  const [donateCampaign, setDonateCampaign] = useState<DonationCampaign | null>(null);
  const [purchaseProduct, setPurchaseProduct] = useState<DigitalProduct | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const hasAffiliateRef = !!searchParams.get('ref');
  const pathTab = pathname.split('/').pop();
  const defaultTab = hasAffiliateRef && !['content', 'events', 'store', 'donate', 'offerings', 'dons', 'photos', 'programs'].includes(pathTab || '') ? 'store' : 'home';
  const activeTab = ['content', 'events', 'store', 'donate', 'offerings', 'dons', 'photos', 'programs'].includes(pathTab || '') ? (pathTab === 'dons' ? 'offerings' : pathTab!) : defaultTab;

  const { data: org, isLoading: orgLoading } = useOrgBySlug(slug);
  const { data: media = [] } = useOrgMedia(org?.id);
  const { data: announcements = [] } = useOrgAnnouncements(org?.id);
  const { data: events = [] } = useOrgEvents(org?.id);
  const { data: campaigns = [] } = useOrgCampaigns(org?.id);
  const { data: products = [] } = useOrgProducts(org?.id);
  const { data: offerings = [] } = useOrgOfferings(org?.id);
  const { data: programs = [] } = useOrgPrograms(org?.id);
  const publishedPrograms = (programs as any[]).filter((p: any) => p.is_published);
  const { data: photos = [] } = useQuery({
    queryKey: ['org-photos-public', org?.id],
    queryFn: async () => {
      if (!org?.id) return [];
      const { data } = await db.from('org_photos').select('*').eq('organization_id', org.id).eq('is_published', true).order('display_order', { ascending: true });
      return data || [];
    },
    enabled: !!org?.id,
  });
  const { data: purchases = [] } = useMyPurchases();
  const purchasedProductIds = new Set(purchases.map(p => p.product_id));
  const { data: pageSettings } = useOrgPageSettings(org?.id);
  const { data: waitlists = [] } = useWaitlists(org?.id);

  const { data: memberCount = 0 } = useQuery({
    queryKey: ['org-member-count', org?.id],
    queryFn: async () => {
      if (!org?.id) return 0;
      const { count } = await db.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', org.id);
      return count || 0;
    },
    enabled: !!org?.id,
  });

  // Theme
  const customPrimary = pageSettings?.theme_primary_color;
  const customAccent = pageSettings?.theme_accent_color;
  const themeStyle = (customPrimary || customAccent) ? {
    '--primary': customPrimary || undefined,
    '--accent': customAccent || undefined,
    '--ring': customPrimary || undefined,
    '--primary-foreground': '0 0% 100%',
    '--sidebar-primary': customPrimary || undefined,
  } as React.CSSProperties : undefined;

  const fbPixel = (pageSettings as any)?.facebook_pixel_id;
  const ttPixel = (pageSettings as any)?.tiktok_pixel_id;
  const gTagId = (pageSettings as any)?.google_tag_id;

  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';
  const isAdmin = org ? canManage(org.id) : false;
  const isOwner = org ? org.owner_id === user?.id : false;
  const orgAny = org as any;
  const sectionOrder = pageSettings?.section_order || ['products', 'offerings', 'campaigns', 'content', 'programs', 'photos', 'events'];
  const rawHiddenSections = new Set(pageSettings?.hidden_sections || []);
  // Apply feature-gating on top of admin-configured hidden sections.
  // Admins/owners still see everything so they can configure their page.
  const hiddenSections = isAdmin ? rawHiddenSections : computeHiddenSections(org as any, rawHiddenSections);
  const showStoreTab = isFeatureEnabledForPublic(org as any, 'digital_products');
  const showDonateTab = isFeatureEnabledForPublic(org as any, 'donation_gifts');
  const showProgramsTab = isFeatureEnabledForPublic(org as any, 'ai_formation_creation');
  const showEventsTab = isFeatureEnabledForPublic(org as any, 'events');

  // Ensure currentOrg is set to viewed org before navigating to admin
  const adminNavigate = useCallback((path: string) => {
    if (org && currentOrg?.id !== org.id) {
      const targetOrg = userOrgs.find(o => o.id === org.id);
      if (targetOrg) setCurrentOrg(targetOrg);
    }
    navigate(path);
  }, [org, currentOrg, userOrgs, setCurrentOrg, navigate]);

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

  const pinnedAnnouncement = announcements.find((a) => a.is_pinned);

  // Determine base URL: use org's custom domain if we're on one
  const hostname = window.location.hostname;
  const isOnOrgDomain = !isMainPlatformDomain(hostname);
  const orgBaseUrl = isOnOrgDomain ? window.location.origin : `https://siteviral.com/org/${slug}`;
  const tabSuffix = activeTab !== 'home' && activeTab !== defaultTab ? `/${activeTab}` : '';
  const orgCanonical = isOnOrgDomain ? `${window.location.origin}${tabSuffix}` : `https://siteviral.com/org/${slug}${tabSuffix}`;

  const navigateTab = (tab: string) => {
    const base = `/org/${slug}`;
    navigate(tab === 'home' ? base : `${base}/${tab}`, { replace: true });
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const hasAnyContent = [products, campaigns, offerings, media, photos, events, publishedPrograms].some(arr => arr.length > 0);

  const toggleAffiliation = async () => {
    // Handled inside OrgAdminToolbar — kept for backwards compat
  };

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      <PixelInjector facebookPixelId={fbPixel} tiktokPixelId={ttPixel} googleTagId={gTagId} />
      {isOnOrgDomain && <DynamicFavicon logoUrl={org.logo_url} orgName={org.name} orgDescription={org.description || undefined} />}
      <SEOHead
        title={isOnOrgDomain ? org.name : `${org.name} — Plateforme digitale sur Siteviral`}
        description={org.description || `Découvrez ${org.name} sur Siteviral : produits numériques, formations, événements et plus. Achetez ou devenez ambassadeur.`}
        ogImage={org.banner_url || org.logo_url}
        canonicalUrl={orgCanonical}
        keywords={`${org.name}, plateforme digitale, produits numériques, ${org.category === 'church' ? 'église en ligne' : org.category === 'ngo' ? 'ONG' : 'créateur'}, Siteviral`}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: org.name,
            description: org.description,
            url: orgCanonical,
            image: org.logo_url,
            ...(org.website ? { sameAs: [org.website] } : {}),
            ...(isOnOrgDomain ? {} : { memberOf: { '@type': 'WebSite', name: 'Siteviral', url: 'https://siteviral.com' } }),
            potentialAction: {
              '@type': 'ViewAction',
              target: isOnOrgDomain ? `${orgBaseUrl}/store` : `https://siteviral.com/org/${slug}/store`,
              name: locale === 'fr' ? 'Voir la boutique' : 'View store',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: isOnOrgDomain
              ? [
                  { '@type': 'ListItem', position: 1, name: org.name, item: orgCanonical },
                ]
              : [
                  { '@type': 'ListItem', position: 1, name: 'Siteviral', item: 'https://siteviral.com' },
                  { '@type': 'ListItem', position: 2, name: 'Explorer', item: 'https://siteviral.com/discover' },
                  { '@type': 'ListItem', position: 3, name: org.name, item: `https://siteviral.com/org/${slug}` },
                ],
          },
        ]}
      />

      <OrgPublicHeader
        org={org}
        slug={slug!}
        memberCount={memberCount}
        products={products}
        media={media}
        events={events}
        photos={photos}
        hasAffiliateRef={hasAffiliateRef}
      />

      <div className={cn('container', isAdmin ? 'max-w-7xl' : 'max-w-5xl')}>
        <div className={cn(isAdmin ? 'flex flex-col lg:flex-row gap-6' : '')}>
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Pinned announcement */}
            {pinnedAnnouncement && (
              <div
                className="mb-6 group relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-primary/5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/announcement/${pinnedAnnouncement.id}`)}
              >
                {pinnedAnnouncement.image_url && (
                  <div className="h-32 overflow-hidden">
                    <img src={pinnedAnnouncement.image_url} alt={pinnedAnnouncement.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 h-32 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  </div>
                )}
                <div className="p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-base">📌</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Annonce épinglée</span>
                    </div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{pinnedAnnouncement.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{stripHtml(pinnedAnnouncement.body)}</p>
                  </div>
                  <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                {/* Animated accent line */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent w-0 group-hover:w-full transition-all duration-500" />
              </div>
            )}

            {/* Tabs */}
            <div ref={tabsRef} className="scroll-mt-14">
              <Tabs value={activeTab} onValueChange={navigateTab} className="w-full">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1 sticky top-12 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4">
                  {[
                    { value: 'home', label: t('org_public.home'), icon: Home, count: null },
                    ...((showStoreTab || isAdmin) && (products.length > 0 || isAdmin) ? [{ value: 'store', label: t('org_public.store'), icon: ShoppingBag, count: products.length }] : []),
                    ...((showDonateTab || isAdmin) && (campaigns.length > 0 || isAdmin) ? [{ value: 'donate', label: t('org_public.donations'), icon: Heart, count: campaigns.length }] : []),
                    ...((showDonateTab || isAdmin) && (offerings.length > 0 || (isAdmin && orgAny.offerings_enabled)) ? [{ value: 'offerings', label: locale === 'fr' ? 'Dons' : 'Donations', icon: HandHeart, count: offerings.length }] : []),

                    ...(media.length > 0 || isAdmin ? [{ value: 'content', label: t('org_public.content'), icon: Play, count: media.length }] : []),
                    ...((showProgramsTab || isAdmin) && (publishedPrograms.length > 0 || isAdmin) ? [{ value: 'programs', label: locale === 'fr' ? 'Formations' : 'Programs', icon: GraduationCap, count: publishedPrograms.length }] : []),
                    ...(photos.length > 0 || isAdmin ? [{ value: 'photos', label: t('org_public.photos'), icon: Camera, count: photos.length }] : []),
                    ...((showEventsTab || isAdmin) && (events.length > 0 || isAdmin) ? [{ value: 'events', label: t('org_public.events'), icon: CalendarDays, count: events.length }] : []),
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

                {/* HOME */}
                <TabsContent value="home" className="space-y-8 pb-12">
                  <OrgHomeSections
                    slug={slug!}
                    products={products}
                    campaigns={campaigns}
                    offerings={offerings}
                    media={media}
                    photos={photos}
                    events={events}
                    programs={publishedPrograms}
                    purchasedProductIds={purchasedProductIds}
                    sectionOrder={sectionOrder}
                    hiddenSections={hiddenSections}
                    onPurchase={(p) => setPurchaseProduct(p)}
                    onDonate={(c) => setDonateCampaign(c)}
                    onSelectOffering={(o) => setSelectedOffering(o)}
                    onPhotoClick={(i) => setLightboxIndex(i)}
                  />
                  {org?.id && <SubscriptionPlansWidget orgId={org.id} currency={org.currency || 'XOF'} />}

                  {(waitlists as any[]).filter(w => w.is_active).length > 0 && (
                    <div className="space-y-3">
                      <h2 className="font-semibold text-sm">🚀 Bientôt disponible</h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(waitlists as any[]).filter(w => w.is_active).map(w => <WaitlistWidget key={w.id} waitlist={w} />)}
                      </div>
                    </div>
                  )}

                  {!hasAnyContent && (waitlists as any[]).filter(w => w.is_active).length === 0 && (
                    <EmptyState variant="content" description={t('org_public.no_content')} />
                  )}
                </TabsContent>

                {/* STORE */}
                <TabsContent value="store">
                  {isAdmin && (
                    <div className="mb-4">
                      <Button size="sm" className="gap-1.5" onClick={() => adminNavigate('/admin/products/new')}>
                        <Plus className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Ajouter un produit' : 'Add product'}
                      </Button>
                    </div>
                  )}
                  {products.length === 0 ? (
                    <EmptyState variant="purchases" description={t('org_public.no_products_desc')} />
                  ) : (
                    <>
                      <div className="mb-4 p-4 rounded-2xl bg-primary/8 border border-primary/20 flex items-center gap-3">
                        <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground">{t('org_public.store_info')}</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onPurchase={() => setPurchaseProduct(p)} isPurchased={purchasedProductIds.has(p.id)} hideCommission hideShare />)}
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* DONATE */}
                <TabsContent value="donate">
                  {isAdmin && (
                    <div className="mb-4">
                      <Button size="sm" className="gap-1.5" onClick={() => adminNavigate('/admin/campaigns/new')}>
                        <Plus className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Ajouter une campagne' : 'Add campaign'}
                      </Button>
                    </div>
                  )}
                  {campaigns.length === 0 ? <EmptyState variant="campaigns" /> : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {campaigns.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)}
                    </div>
                  )}
                </TabsContent>

                {/* OFFERINGS */}
                <TabsContent value="offerings">
                  {offerings.length === 0 ? (
                    <EmptyState variant="generic" title={locale === 'fr' ? 'Aucun don configuré' : 'No donations configured'} description={locale === 'fr' ? 'Aucun type de don configuré pour le moment.' : 'No donation types configured yet.'} />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {offerings.map((o) => <OfferingCard key={o.id} offering={o} onSelect={setSelectedOffering} />)}
                    </div>
                  )}
                </TabsContent>

                {/* CONTENT */}
                <TabsContent value="content">
                  {isAdmin && (
                    <div className="mb-4">
                      <Button size="sm" className="gap-1.5" onClick={() => adminNavigate('/admin/media/new')}>
                        <Plus className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Ajouter contenu' : 'Add content'}
                      </Button>
                    </div>
                  )}
                  {media.length === 0 ? <EmptyState variant="content" /> : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {media.map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
                    </div>
                  )}
                </TabsContent>

                {/* EVENTS */}
                <TabsContent value="events">
                  {isAdmin && (
                    <div className="mb-4">
                      <Button size="sm" className="gap-1.5" onClick={() => adminNavigate('/admin/events/new')}>
                        <Plus className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Ajouter événement' : 'Add event'}
                      </Button>
                    </div>
                  )}
                  {events.length === 0 ? (
                    <EmptyState variant="generic" title={t('org_public.no_events')} description={t('org_public.no_events_desc')} />
                  ) : (
                    <div className="space-y-4 pb-8">
                      {events.map((ev) => {
                        const evDate = ev.event_date ? new Date(ev.event_date) : null;
                        const isFuture = evDate && evDate > new Date();
                        return (
                          <div
                            key={ev.id}
                            className="group rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => navigate(`/event/${ev.id}`)}
                          >
                            {ev.image_url && (
                              <div className="aspect-video overflow-hidden relative">
                                <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                              </div>
                            )}
                            {/* Countdown */}
                            {isFuture && (
                              <div className="px-4 pt-4">
                                <EventCountdown endDate={ev.event_date} />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                  {evDate ? (
                                    <>
                                      <span className="text-[10px] font-bold text-primary uppercase">{evDate.toLocaleDateString(dateFmt, { month: 'short' })}</span>
                                      <span className="text-sm font-bold leading-none">{evDate.getDate()}</span>
                                    </>
                                  ) : (
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{ev.title}</h3>
                                  {evDate && <p className="text-xs text-muted-foreground mt-0.5">{evDate.toLocaleDateString(dateFmt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                                  {ev.location && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                                      <span className="text-xs text-primary truncate">{ev.location}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* PROGRAMS */}
                <TabsContent value="programs">
                  {isAdmin && (
                    <div className="mb-4">
                      <Button size="sm" className="gap-1.5" onClick={() => adminNavigate('/admin/programs/new')}>
                        <Plus className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Ajouter formation' : 'Add program'}
                      </Button>
                    </div>
                  )}
                  {publishedPrograms.length === 0 ? (
                    <EmptyState variant="generic" title={locale === 'fr' ? 'Aucune formation' : 'No programs'} description={locale === 'fr' ? 'Aucune formation disponible pour le moment.' : 'No programs available yet.'} />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {publishedPrograms.map((prog: any) => (
                        <div key={prog.id} className="rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated transition-all cursor-pointer overflow-hidden" onClick={() => navigate(`/program/${prog.id}`)}>
                          {prog.cover_image_url && (
                            <div className="aspect-video overflow-hidden">
                              <img src={prog.cover_image_url} alt={prog.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-sm mb-1">{prog.title}</h3>
                            {prog.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{prog.description}</p>}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>{prog.module_count || 0} {locale === 'fr' ? 'module(s)' : 'module(s)'}</span>
                              <span>·</span>
                              <span className="font-semibold text-primary">{prog.price > 0 ? `${prog.price} ${prog.currency || 'XOF'}` : locale === 'fr' ? 'Gratuit' : 'Free'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* PHOTOS */}
                <TabsContent value="photos">
                  {isAdmin && (
                    <div className="mb-4">
                      <Button size="sm" className="gap-1.5" onClick={() => adminNavigate('/admin/photos')}>
                        <Plus className="h-3.5 w-3.5" /> {locale === 'fr' ? 'Ajouter photos' : 'Add photos'}
                      </Button>
                    </div>
                  )}
                  {photos.length === 0 ? (
                    <EmptyState variant="generic" title={t('org_public.no_photos')} description={t('org_public.no_photos_desc')} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {photos.map((photo: any, i: number) => (
                        <div key={photo.id} className="group relative rounded-xl overflow-hidden bg-card border border-border shadow-card hover:shadow-elevated transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }} onClick={() => setLightboxIndex(i)}>
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
      </div>
      <PoweredBySiteViral ownerId={(org as any)?.owner_id} />

          {/* Admin inline panel — desktop sidebar, mobile collapsible */}
          {isAdmin && org && (
            <>
              {/* Desktop: sticky sidebar */}
              <aside className="hidden lg:block w-[320px] shrink-0">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide pb-6">
                  <OrgAdminToolbar
                    orgId={org.id}
                    orgSlug={org.slug}
                    isOwner={isOwner}
                    affiliationEnabled={!!orgAny.affiliation_enabled}
                    pageSettings={pageSettings || null}
                    onStartTour={() => setTourOpen(true)}
                    onToggleAffiliation={toggleAffiliation}
                  />
                </div>
              </aside>

              {/* Mobile: collapsible panel at top */}
              <MobileAdminPanel
                orgId={org.id}
                orgSlug={org.slug}
                isOwner={isOwner}
                affiliationEnabled={!!orgAny.affiliation_enabled}
                pageSettings={pageSettings || null}
                onStartTour={() => setTourOpen(true)}
                onToggleAffiliation={toggleAffiliation}
              />
            </>
          )}
        </div>
      </div>
      <OrgPageTour open={tourOpen} onClose={() => setTourOpen(false)} />

      <DonateModal campaign={donateCampaign} organizationId={org?.id ?? ''} open={!!donateCampaign} onClose={() => setDonateCampaign(null)} />
      <OfferingModal offering={selectedOffering} organizationId={org?.id ?? ''} open={!!selectedOffering} onClose={() => setSelectedOffering(null)} />
      <ProductPurchaseModal product={purchaseProduct} organizationId={org?.id ?? ''} open={!!purchaseProduct} onClose={() => setPurchaseProduct(null)} />
      <PhotoLightbox photos={photos} initialIndex={lightboxIndex ?? 0} open={lightboxIndex !== null} onClose={() => setLightboxIndex(null)} />

      {pageSettings?.popup_config && (pageSettings.popup_config as any)?.enabled && (
        <SmartPopup config={pageSettings.popup_config as any} orgName={org.name} />
      )}
    </div>
  );
}

function MobileAdminPanel(props: {
  orgId: string; orgSlug: string; isOwner: boolean;
  affiliationEnabled: boolean; pageSettings: any;
  onStartTour: () => void; onToggleAffiliation: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();

  return (
    <div className="lg:hidden mb-6 -order-1 w-full">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-3 rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold text-primary"
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {isFr ? '⚙️ Gérer ma page' : '⚙️ Manage page'}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <OrgAdminToolbar {...props} />
        </div>
      )}
    </div>
  );
}
