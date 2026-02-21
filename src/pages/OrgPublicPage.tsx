import { useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Globe, MessageCircle, CheckCircle2, Users, CalendarDays,
  Share2, ShoppingBag, Heart, Camera
} from 'lucide-react';
import { DonationCampaign, DigitalProduct } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useAffiliateCapture } from '@/hooks/useAffiliateCapture';
import { PhotoLightbox } from '@/components/photos/PhotoLightbox';

export default function OrgPublicPage() {
  useAffiliateCapture(); // capture ?ref=CODE from URL into sessionStorage
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { joinOrg, leaveOrg, isMemberOf } = useOrg();
  const { toast } = useToast();
  const [joining, setJoining] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState<DonationCampaign | null>(null);
  const [purchaseProduct, setPurchaseProduct] = useState<DigitalProduct | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // If user came via affiliate link, default tab to store (conversion-focused)
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

  if (orgLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="h-48 rounded-2xl skeleton-shimmer mb-4" />
        <SkeletonList count={6} />
      </div>
    );
  }

  if (!org) {
    return (
      <EmptyState
        title="Organization not found"
        description="This community page doesn't exist or is inactive."
        action={{ label: 'Browse communities', onClick: () => navigate('/discover') }}
        className="min-h-screen"
      />
    );
  }

  const isMember = isMemberOf(org.id);

  const handleJoinLeave = async () => {
    if (!user) { navigate('/auth'); return; }
    setJoining(true);
    if (isMember) {
      await leaveOrg(org.id);
      toast({ title: `Left ${org.name}` });
    } else {
      await joinOrg(org.id);
      toast({ title: `Joined ${org.name}!` });
    }
    setJoining(false);
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`Check out ${org.name} on Siteviral: ${window.location.href}`)}`;
    window.open(url, '_blank');
  };

  const pinnedAnnouncement = announcements.find((a) => a.is_pinned);

  const navigateTab = (tab: string) => {
    const base = `/org/${slug}`;
    navigate(tab === 'home' ? base : `${base}/${tab}`);
  };

  return (
    <div className="min-h-screen">
      {/* Guest top bar */}
      {!user && (
        <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gold-gradient flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">SV</span>
            </div>
            <span className="text-sm font-semibold">Siteviral</span>
          </div>
          <Button size="sm" className="h-7 text-xs gold-gradient text-primary-foreground border-0" onClick={() => navigate('/auth')}>
            Sign in
          </Button>
        </div>
      )}

      {/* Affiliate referral banner */}
      {hasAffiliateRef && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
          <p className="text-xs text-primary font-medium">
            You were invited to explore {org.name}'s store — browse products &amp; digital downloads below!
          </p>
        </div>
      )}

      {/* Banner */}
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {org.banner_url ? (
          <img src={org.banner_url} alt={org.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full hero-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      </div>

      <div className="container max-w-5xl">
        {/* Org header */}
        <div className="relative -mt-10 flex flex-col sm:flex-row items-start gap-4 mb-6">
          {/* Logo */}
          <div className="h-20 w-20 rounded-2xl border-4 border-background shadow-elevated overflow-hidden bg-card shrink-0">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gold-gradient flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">
                  {org.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 sm:pt-10">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{org.name}</h1>
              {org.is_verified && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
              <Badge variant="secondary" className="text-xs capitalize">{org.category}</Badge>
            </div>
            {org.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{org.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {org.whatsapp && (
                <a
                  href={`https://wa.me/${org.whatsapp.replace(/\D/g, '')}`}
                  className="flex items-center gap-1 text-xs text-primary"
                  target="_blank" rel="noreferrer"
                >
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              )}
              {org.website && (
                <a href={org.website} className="flex items-center gap-1 text-xs text-accent" target="_blank" rel="noreferrer">
                  <Globe className="h-3 w-3" /> Website
                </a>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {org.country}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:pt-10">
            <Button variant="outline" size="sm" onClick={shareWhatsApp} className="h-8 gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button
              size="sm"
              onClick={handleJoinLeave}
              disabled={joining}
              className={`h-8 text-xs ${isMember ? '' : 'gold-gradient text-primary-foreground border-0 shadow-gold'}`}
              variant={isMember ? 'outline' : 'default'}
            >
              {joining ? '...' : isMember ? 'Leave' : 'Join'}
            </Button>
          </div>
        </div>

        {/* Pinned announcement */}
        {pinnedAnnouncement && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center shrink-0">
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
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide mb-6 bg-muted/60 h-10">
            <TabsTrigger value="home" className="text-xs">Home</TabsTrigger>
            {org.monetization_enabled && products.length > 0 && (
              <TabsTrigger value="store" className="text-xs gap-1">
                <ShoppingBag className="h-3 w-3" />
                Store ({products.length})
              </TabsTrigger>
            )}
            {org.monetization_enabled && campaigns.length > 0 && (
              <TabsTrigger value="donate" className="text-xs gap-1">
                <Heart className="h-3 w-3" />
                Donate ({campaigns.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="content" className="text-xs">Content ({media.length})</TabsTrigger>
            {photos.length > 0 && (
              <TabsTrigger value="photos" className="text-xs gap-1">
                <Camera className="h-3 w-3" />
                Photos ({photos.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="events" className="text-xs">Events ({events.length})</TabsTrigger>
          </TabsList>

          {/* ─── HOME TAB ─── */}
          <TabsContent value="home" className="space-y-8">

            {/* Products first — highest conversion priority */}
            {products.length > 0 && org.monetization_enabled && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-primary" /> Digital Products
                  </h2>
                  {products.length > 3 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('store')}>
                      View all →
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.slice(0, 3).map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} onPurchase={() => setPurchaseProduct(p)} isPurchased={purchasedProductIds.has(p.id)} />
                  ))}
                </div>
              </section>
            )}

            {/* Active donation campaigns */}
            {campaigns.length > 0 && org.monetization_enabled && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-destructive" /> Active Campaigns
                  </h2>
                  {campaigns.length > 2 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('donate')}>
                      View all →
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {campaigns.slice(0, 2).map((c, i) => (
                    <CampaignCard key={c.id} campaign={c} index={i} onDonate={() => setDonateCampaign(c)} />
                  ))}
                </div>
              </section>
            )}

            {/* Featured content */}
            {media.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">Featured Content</h2>
                  {media.length > 3 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('content')}>
                      View all →
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {media.slice(0, 3).map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
                </div>
              </section>
            )}

            {/* Photos preview */}
            {photos.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-primary" /> Photos
                  </h2>
                  {photos.length > 4 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigateTab('photos')}>
                      View all →
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
            )}

            {/* Upcoming events */}
            {events.length > 0 && (
              <section>
                <h2 className="font-semibold mb-3 text-sm">Upcoming Events</h2>
                <div className="space-y-2">
                  {events.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="h-10 w-10 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                        <CalendarDays className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR') : 'TBA'}</p>
                      </div>
                      {ev.location && <span className="text-xs text-muted-foreground hidden sm:block">{ev.location}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {media.length === 0 && events.length === 0 && campaigns.length === 0 && products.length === 0 && (
              <EmptyState variant="content" description="This organization hasn't published content yet." />
            )}
          </TabsContent>

          {/* ─── STORE TAB ─── */}
          <TabsContent value="store">
            {products.length === 0 ? (
              <EmptyState variant="purchases" description="No products available yet." />
            ) : (
              <>
                <div className="mb-4 p-4 rounded-2xl bg-primary/8 border border-primary/20 flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Purchase any product below to get instant access. Payments are processed securely via Paystack.
                  </p>
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
              <EmptyState variant="generic" title="No events" description="No upcoming events found." />
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
                      {ev.event_date && <span className="text-xs text-muted-foreground">{new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
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
              <EmptyState variant="generic" title="No photos" description="No photos have been shared yet." />
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
                      <img
                        src={photo.image_url}
                        alt={photo.caption || 'Photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
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
    </div>
  );
}
