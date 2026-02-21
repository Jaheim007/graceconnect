import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Megaphone, CalendarDays, ShoppingBag, Heart,
  Play, Headphones, Film, TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MediaCard } from '@/components/media/MediaCard';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { DonateModal } from '@/components/donations/DonateModal';
import { ProductPurchaseModal } from '@/components/products/ProductPurchaseModal';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { FeedPhotoSlider } from '@/components/photos/FeedPhotoSlider';
import { EmptyState } from '@/components/ui/EmptyState';
import { useOrg } from '@/contexts/OrgContext';
import { useFeedMedia } from '@/hooks/useMedia';
import { useFeedAnnouncements } from '@/hooks/useAnnouncements';
import { useFeedEvents } from '@/hooks/useEvents';
import { useFeedProducts, useFeedCampaigns } from '@/hooks/useMonetization';
import { useMyPurchases } from '@/hooks/usePurchases';
import { DonationCampaign, DigitalProduct } from '@/types/database';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'media' | 'store' | 'campaigns' | 'events';

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Tout', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'media', label: 'Médias', icon: <Play className="h-3.5 w-3.5" /> },
  { value: 'store', label: 'Boutique', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { value: 'campaigns', label: 'Campagnes', icon: <Heart className="h-3.5 w-3.5" /> },
  { value: 'events', label: 'Événements', icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

export default function FeedPage() {
  const navigate = useNavigate();
  const { userOrgs } = useOrg();
  const orgIds = userOrgs.map((o) => o.id);

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [donateCampaign, setDonateCampaign] = useState<DonationCampaign | null>(null);
  const [buyProduct, setBuyProduct] = useState<DigitalProduct | null>(null);

  const { data: allMedia = [], isLoading: mediaLoading } = useFeedMedia(orgIds);
  const { data: announcements = [], isLoading: announcementsLoading } = useFeedAnnouncements(orgIds);
  const { data: events = [], isLoading: eventsLoading } = useFeedEvents(orgIds);
  const { data: products = [], isLoading: productsLoading } = useFeedProducts(orgIds);
  const { data: campaigns = [], isLoading: campaignsLoading } = useFeedCampaigns(orgIds);
  const { data: purchases = [] } = useMyPurchases();
  const purchasedProductIds = new Set(purchases.map(p => p.product_id));

  const filteredMedia = allMedia.filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()));
  const filteredProducts = products.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));
  const filteredCampaigns = campaigns.filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase()));
  const filteredEvents = events.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()));
  const filteredAnnouncements = announcements.filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  const isLoading = mediaLoading || productsLoading || campaignsLoading || eventsLoading || announcementsLoading;

  if (userOrgs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          variant="feed"
          action={{ label: 'Explorer les communautés', onClick: () => navigate('/discover') }}
        />
      </div>
    );
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Votre fil</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {userOrgs.length} communauté{userOrgs.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        </div>

        {/* Pinned Announcement */}
        {!announcementsLoading && announcements.some((a) => a.is_pinned) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex gap-3 items-start">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">📌 Épinglé</span>
              <p className="font-semibold text-sm mt-0.5 line-clamp-1">{announcements.find((a) => a.is_pinned)?.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{announcements.find((a) => a.is_pinned)?.body}</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all border',
                tab === t.value
                  ? 'gold-gradient text-primary-foreground border-primary shadow-gold'
                  : 'border-border text-muted-foreground hover:text-foreground bg-card'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">

            {/* TAB: ALL */}
            {tab === 'all' && (
              <>
                {!announcementsLoading && filteredAnnouncements.length > 0 && (
                  <section>
                    <SectionHeader icon={<Megaphone className="h-4 w-4 text-primary" />} title="Annonces" />
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                      {filteredAnnouncements.slice(0, 6).map((a, i) => (
                        <motion.div key={a.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="shrink-0 w-60 bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                          {a.image_url && <div className="h-28 overflow-hidden"><img src={a.image_url} alt={a.title} className="w-full h-full object-cover" /></div>}
                          <div className="p-3">
                            {a.is_pinned && <span className="text-[10px] text-primary font-semibold">📌 Épinglé</span>}
                            <h3 className="font-semibold text-xs mt-0.5 line-clamp-2">{a.title}</h3>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3">{a.body}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {!eventsLoading && filteredEvents.length > 0 && (
                  <section>
                    <SectionHeader icon={<CalendarDays className="h-4 w-4 text-accent" />} title="Événements à venir" />
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                      {filteredEvents.map((ev, i) => (
                        <motion.div key={ev.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="shrink-0 w-52 bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                          {ev.image_url ? <div className="h-28 overflow-hidden"><img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" /></div> : <div className="h-16 gold-gradient flex items-center justify-center"><CalendarDays className="h-7 w-7 text-primary-foreground/80" /></div>}
                          <div className="p-3">
                            <p className="font-semibold text-xs line-clamp-2">{ev.title}</p>
                            <p className="text-[10px] text-primary font-medium mt-1">{ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date à confirmer'}</p>
                            {ev.location && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">📍 {ev.location}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {!productsLoading && filteredProducts.length > 0 && (
                  <section>
                    <SectionHeader icon={<ShoppingBag className="h-4 w-4 text-primary" />} title="Boutique" action={{ label: 'Tout voir', onClick: () => setTab('store') }} />
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                      {filteredProducts.slice(0, 6).map((p, i) => <div key={p.id} className="shrink-0 w-52"><ProductCard product={p} index={i} onPurchase={() => setBuyProduct(p)} isPurchased={purchasedProductIds.has(p.id)} /></div>)}
                    </div>
                  </section>
                )}

                {!campaignsLoading && filteredCampaigns.length > 0 && (
                  <section>
                    <SectionHeader icon={<Heart className="h-4 w-4 text-destructive" />} title="Campagnes de dons" action={{ label: 'Tout voir', onClick: () => setTab('campaigns') }} />
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                      {filteredCampaigns.slice(0, 4).map((c, i) => <div key={c.id} className="shrink-0 w-64"><CampaignCard campaign={c} index={i} onDonate={() => setDonateCampaign(c)} /></div>)}
                    </div>
                  </section>
                )}

                <FeedPhotoSlider orgIds={orgIds} />

                <section>
                  <SectionHeader icon={<TrendingUp className="h-4 w-4 text-primary" />} title="Derniers contenus" action={filteredMedia.length > 6 ? { label: 'Tout voir', onClick: () => setTab('media') } : undefined} />
                  {mediaLoading ? <SkeletonList count={6} /> : filteredMedia.length === 0 ? <EmptyState variant="content" /> : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredMedia.slice(0, 6).map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}</div>
                  )}
                </section>
              </>
            )}

            {/* TAB: MEDIA */}
            {tab === 'media' && <section><MediaTypeFilter allMedia={filteredMedia} /></section>}

            {/* TAB: STORE */}
            {tab === 'store' && (
              <section>
                <SectionHeader icon={<ShoppingBag className="h-4 w-4 text-primary" />} title="Boutique" />
                {productsLoading ? <SkeletonList count={4} /> : filteredProducts.length === 0 ? <EmptyState variant="generic" title="Aucun produit" description="Les organisations que vous suivez n'ont pas encore de produits." /> : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} onPurchase={() => setBuyProduct(p)} isPurchased={purchasedProductIds.has(p.id)} />)}</div>
                )}
              </section>
            )}

            {/* TAB: CAMPAIGNS */}
            {tab === 'campaigns' && (
              <section>
                <SectionHeader icon={<Heart className="h-4 w-4 text-destructive" />} title="Campagnes de dons" />
                {campaignsLoading ? <SkeletonList count={4} /> : filteredCampaigns.length === 0 ? <EmptyState variant="campaigns" /> : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredCampaigns.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} onDonate={() => setDonateCampaign(c)} />)}</div>
                )}
              </section>
            )}

            {/* TAB: EVENTS */}
            {tab === 'events' && (
              <section>
                <SectionHeader icon={<CalendarDays className="h-4 w-4 text-accent" />} title="Événements à venir" />
                {eventsLoading ? <SkeletonList count={4} /> : filteredEvents.length === 0 ? <EmptyState variant="generic" title="Aucun événement" description="Aucun événement prévu de vos communautés." /> : (
                  <>
                    {filteredAnnouncements.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Annonces</p>
                        <div className="space-y-3">
                          {filteredAnnouncements.map((a, i) => (
                            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-3 items-start bg-card border border-border rounded-2xl p-3">
                              {a.image_url ? <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0"><img src={a.image_url} alt={a.title} className="w-full h-full object-cover" /></div> : <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5 text-primary" /></div>}
                              <div className="min-w-0">
                                {a.is_pinned && <span className="text-[10px] text-primary font-semibold">📌 Épinglé · </span>}
                                <p className="font-semibold text-sm line-clamp-1">{a.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Événements</p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredEvents.map((ev, i) => (
                        <motion.div key={ev.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                          {ev.image_url ? <div className="h-36 overflow-hidden"><img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" /></div> : <div className="h-24 gold-gradient flex items-center justify-center"><CalendarDays className="h-10 w-10 text-primary-foreground/60" /></div>}
                          <div className="p-4 space-y-1.5">
                            <p className="font-semibold text-sm line-clamp-2">{ev.title}</p>
                            {ev.event_date && <p className="text-xs font-medium text-primary">📅 {new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                            {ev.location && <p className="text-xs text-muted-foreground">📍 {ev.location}</p>}
                            {ev.description && <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{ev.description}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <DonateModal campaign={donateCampaign} organizationId={donateCampaign?.organization_id || ''} open={!!donateCampaign} onClose={() => setDonateCampaign(null)} />
      <ProductPurchaseModal product={buyProduct} organizationId={buyProduct?.organization_id || ''} open={!!buyProduct} onClose={() => setBuyProduct(null)} />
    </div>
  );
}

function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">{icon}<h2 className="font-semibold text-sm">{title}</h2></div>
      {action && <button onClick={action.onClick} className="text-xs text-primary font-medium hover:underline">{action.label} →</button>}
    </div>
  );
}

function MediaTypeFilter({ allMedia }: { allMedia: ReturnType<typeof useFeedMedia>['data'] }) {
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const MEDIA_FILTERS = [
    { value: 'all', label: 'Tout', icon: <TrendingUp className="h-3 w-3" /> },
    { value: 'video', label: 'Vidéos', icon: <Play className="h-3 w-3" /> },
    { value: 'audio', label: 'Audio', icon: <Headphones className="h-3 w-3" /> },
    { value: 'reel', label: 'Reels', icon: <Film className="h-3 w-3" /> },
  ];
  const filtered = (allMedia || []).filter((m) => mediaFilter === 'all' || m.media_type === mediaFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {MEDIA_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setMediaFilter(f.value)} className={cn('shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all', mediaFilter === f.value ? 'gold-gradient text-primary-foreground border-primary shadow-gold' : 'border-border text-muted-foreground bg-card hover:text-foreground')}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState variant="content" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((m, i) => <MediaCard key={m.id} media={m} index={i} />)}</div>
      )}
    </div>
  );
}
