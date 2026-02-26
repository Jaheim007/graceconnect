import { useState, useRef } from 'react';
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
import { MediaCard } from '@/components/media/MediaCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';
import { DonateModal } from '@/components/donations/DonateModal';
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
import { SmartPopup } from '@/components/org/SmartPopup';
import { WaitlistWidget } from '@/components/org/WaitlistWidget';
import { SubscriptionPlansWidget } from '@/components/subscriptions/SubscriptionPlansWidget';
import { PhotoLightbox } from '@/components/photos/PhotoLightbox';
import { useAffiliateCapture } from '@/hooks/useAffiliateCapture';
import { useWaitlists } from '@/hooks/useWaitlists';
import { DonationCampaign, DigitalProduct } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  Home, ShoppingBag, Heart, Play, Camera, CalendarDays
} from 'lucide-react';
import React from 'react';

export default function OrgPublicPage() {
  useAffiliateCapture();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { canManage } = useOrg();
  const { t, locale } = useI18n();

  const [donateCampaign, setDonateCampaign] = useState<DonationCampaign | null>(null);
  const [purchaseProduct, setPurchaseProduct] = useState<DigitalProduct | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const hasAffiliateRef = !!searchParams.get('ref');
  const pathTab = pathname.split('/').pop();
  const defaultTab = hasAffiliateRef && !['content', 'events', 'store', 'donate', 'photos'].includes(pathTab || '') ? 'store' : 'home';
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
  const sectionOrder = pageSettings?.section_order || ['products', 'campaigns', 'content', 'photos', 'events'];
  const hiddenSections = new Set(pageSettings?.hidden_sections || []);

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

  const navigateTab = (tab: string) => {
    const base = `/org/${slug}`;
    navigate(tab === 'home' ? base : `${base}/${tab}`, { replace: true });
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const hasAnyContent = [products, campaigns, media, photos, events].some(arr => arr.length > 0);

  const toggleAffiliation = async () => {
    // Handled inside OrgAdminToolbar — kept for backwards compat
  };

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      <PixelInjector facebookPixelId={fbPixel} tiktokPixelId={ttPixel} googleTagId={gTagId} />
      <SEOHead
        title={`${org.name} — Plateforme digitale sur Siteviral`}
        description={org.description || `Découvrez ${org.name} sur Siteviral : produits numériques, formations, événements et plus. Achetez ou devenez ambassadeur.`}
        ogImage={org.banner_url || org.logo_url}
        canonicalUrl={`https://siteviral.com/org/${slug}`}
        keywords={`${org.name}, plateforme digitale, produits numériques, ${org.category === 'church' ? 'église en ligne' : org.category === 'ngo' ? 'ONG' : 'créateur'}, Siteviral`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: org.name,
          description: org.description,
          url: `https://siteviral.com/org/${slug}`,
          image: org.logo_url,
          memberOf: { '@type': 'WebSite', name: 'Siteviral', url: 'https://siteviral.com' },
          potentialAction: {
            '@type': 'ViewAction',
            target: `https://siteviral.com/org/${slug}/store`,
            name: locale === 'fr' ? 'Voir la boutique' : 'View store',
          },
        }}
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

      <div className="container max-w-5xl">
        {/* Pinned announcement */}
        {pinnedAnnouncement && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors" onClick={() => navigate(`/announcement/${pinnedAnnouncement.id}`)}>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs">📌</span></div>
              <div>
                <h3 className="font-semibold text-sm">{pinnedAnnouncement.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{pinnedAnnouncement.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div ref={tabsRef} className="scroll-mt-14">
          <Tabs value={activeTab} onValueChange={navigateTab} className="w-full">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1 sticky top-12 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4">
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

            {/* HOME */}
            <TabsContent value="home" className="space-y-8">
              <OrgHomeSections
                slug={slug!}
                products={products}
                campaigns={campaigns}
                media={media}
                photos={photos}
                events={events}
                purchasedProductIds={purchasedProductIds}
                sectionOrder={sectionOrder}
                hiddenSections={hiddenSections}
                onPurchase={(p) => setPurchaseProduct(p)}
                onDonate={(c) => setDonateCampaign(c)}
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

            {/* DONATE */}
            <TabsContent value="donate">
              {campaigns.length === 0 ? <EmptyState variant="campaigns" /> : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {campaigns.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)}
                </div>
              )}
            </TabsContent>

            {/* CONTENT */}
            <TabsContent value="content">
              {media.length === 0 ? <EmptyState variant="content" /> : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {media.map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
                </div>
              )}
            </TabsContent>

            {/* EVENTS */}
            <TabsContent value="events">
              {events.length === 0 ? (
                <EmptyState variant="generic" title={t('org_public.no_events')} description={t('org_public.no_events_desc')} />
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="p-4 rounded-2xl border border-border bg-card shadow-card">
                      {ev.image_url && <div className="h-40 rounded-xl overflow-hidden mb-3"><img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" /></div>}
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

            {/* PHOTOS */}
            <TabsContent value="photos">
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

      {/* Admin toolbar */}
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
      <OrgPageTour open={tourOpen} onClose={() => setTourOpen(false)} />

      <DonateModal campaign={donateCampaign} organizationId={org?.id ?? ''} open={!!donateCampaign} onClose={() => setDonateCampaign(null)} />
      <ProductPurchaseModal product={purchaseProduct} organizationId={org?.id ?? ''} open={!!purchaseProduct} onClose={() => setPurchaseProduct(null)} />
      <PhotoLightbox photos={photos} initialIndex={lightboxIndex ?? 0} open={lightboxIndex !== null} onClose={() => setLightboxIndex(null)} />

      {pageSettings?.popup_config && (pageSettings.popup_config as any)?.enabled && (
        <SmartPopup config={pageSettings.popup_config as any} orgName={org.name} />
      )}
    </div>
  );
}
