import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrgBySlug } from '@/hooks/useOrganizations';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgAnnouncements } from '@/hooks/useAnnouncements';
import { useOrgEvents } from '@/hooks/useEvents';
import { useOrgCampaigns, useOrgProducts } from '@/hooks/useMonetization';
import { MediaCard } from '@/components/media/MediaCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { ProductCard } from '@/components/products/ProductCard';
import { DonateModal } from '@/components/donations/DonateModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, MessageCircle, CheckCircle2, Users, CalendarDays, Share2 } from 'lucide-react';
import { DonationCampaign } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export default function OrgPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinOrg, leaveOrg, isMemberOf } = useOrg();
  const { toast } = useToast();
  const [joining, setJoining] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState<DonationCampaign | null>(null);

  const { data: org, isLoading: orgLoading } = useOrgBySlug(slug);
  const { data: media = [] } = useOrgMedia(org?.id);
  const { data: announcements = [] } = useOrgAnnouncements(org?.id);
  const { data: events = [] } = useOrgEvents(org?.id);
  const { data: campaigns = [] } = useOrgCampaigns(org?.id);
  const { data: products = [] } = useOrgProducts(org?.id);

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
    const url = `https://wa.me/?text=${encodeURIComponent(`Check out ${org.name} on GraceConnect: ${window.location.href}`)}`;
    window.open(url, '_blank');
  };

  const pinnedAnnouncement = announcements.find((a) => a.is_pinned);

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {org.banner_url ? (
          <img src={org.banner_url} alt={org.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full hero-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
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
                  className="flex items-center gap-1 text-xs text-green-500"
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
            <Button
              variant="outline"
              size="sm"
              onClick={shareWhatsApp}
              className="h-8 gap-1.5 text-xs"
            >
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
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide mb-6 bg-muted/60 h-10">
            <TabsTrigger value="home" className="text-xs">Home</TabsTrigger>
            <TabsTrigger value="content" className="text-xs">Content ({media.length})</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Events ({events.length})</TabsTrigger>
            {org.monetization_enabled && (
              <>
                <TabsTrigger value="store" className="text-xs">Store ({products.length})</TabsTrigger>
                <TabsTrigger value="donate" className="text-xs">Donate ({campaigns.length})</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Home tab */}
          <TabsContent value="home" className="space-y-8">
            {media.length > 0 && (
              <section>
                <h2 className="font-semibold mb-3 text-sm">Featured Content</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {media.slice(0, 3).map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
                </div>
              </section>
            )}

            {campaigns.length > 0 && org.monetization_enabled && (
              <section>
                <h2 className="font-semibold mb-3 text-sm">Active Campaigns</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {campaigns.slice(0, 2).map((c, i) => (
                    <CampaignCard key={c.id} campaign={c} index={i} onDonate={() => setDonateCampaign(c)} />
                  ))}
                </div>
              </section>
            )}

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

            {media.length === 0 && events.length === 0 && campaigns.length === 0 && (
              <EmptyState variant="content" description="This organization hasn't published content yet." />
            )}
          </TabsContent>

          {/* Content tab */}
          <TabsContent value="content">
            {media.length === 0 ? (
              <EmptyState variant="content" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {media.map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}
              </div>
            )}
          </TabsContent>

          {/* Events tab */}
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

          {/* Store tab */}
          <TabsContent value="store">
            {products.length === 0 ? (
              <EmptyState variant="purchases" description="No products available yet." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onPurchase={() => {}} />)}
              </div>
            )}
          </TabsContent>

          {/* Donate tab */}
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
        </Tabs>
      </div>

      <DonateModal
        campaign={donateCampaign}
        open={!!donateCampaign}
        onClose={() => setDonateCampaign(null)}
      />
    </div>
  );
}
