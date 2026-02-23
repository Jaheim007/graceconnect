import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Megaphone, CalendarDays, ShoppingBag, Heart,
  Play, Headphones, Film, TrendingUp, MapPin,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  { value: 'all', label: 'All', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'media', label: 'Media', icon: <Play className="h-3.5 w-3.5" /> },
  { value: 'store', label: 'Store', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { value: 'campaigns', label: 'Campaigns', icon: <Heart className="h-3.5 w-3.5" /> },
  { value: 'events', label: 'Events', icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

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
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg px-4 py-10 space-y-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to Siteviral!</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Join organizations to see their content, buy resources, and support their campaigns.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground gap-2 h-12"
              onClick={() => navigate('/create-org')}
            >
              Launch your organization
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-4"
          >
            <p className="text-xs text-muted-foreground">
              💡 Tip: You can share an organization link directly with someone so they can join.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl px-4 py-5 sm:py-6 space-y-5 sm:space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Your Feed</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {userOrgs.length} organization{userOrgs.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
          </div>
        </motion.div>

        {/* Pinned Announcement */}
        {!announcementsLoading && announcements.some((a) => a.is_pinned) && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex gap-3 items-start backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Pinned</span>
              <p className="font-bold text-sm mt-0.5 line-clamp-1">{announcements.find((a) => a.is_pinned)?.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcements.find((a) => a.is_pinned)?.body}</p>
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
                'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border',
                tab === t.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 bg-card'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-10">

            {/* TAB: ALL */}
            {tab === 'all' && (
              <>
                {/* Announcements */}
                {!announcementsLoading && filteredAnnouncements.length > 0 && (
                  <section>
                    <SectionHeader icon={<Megaphone className="h-4 w-4 text-primary" />} title="Announcements" />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                      {filteredAnnouncements.slice(0, 6).map((a) => (
                        <motion.div key={a.id} variants={staggerItem} className="shrink-0 w-72 bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                          {a.image_url && <div className="h-36 overflow-hidden"><img src={a.image_url} alt={a.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>}
                          <div className="p-4">
                            {a.is_pinned && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Pinned</span>}
                            <h3 className="font-bold text-sm mt-1 line-clamp-2">{a.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{a.body}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {/* Events */}
                {!eventsLoading && filteredEvents.length > 0 && (
                  <section>
                    <SectionHeader icon={<CalendarDays className="h-4 w-4 text-accent" />} title="Upcoming Events" />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                      {filteredEvents.map((ev) => (
                        <motion.div key={ev.id} variants={staggerItem} className="shrink-0 w-64 bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                          {ev.image_url ? (
                            <div className="h-36 overflow-hidden"><img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
                          ) : (
                            <div className="h-24 bg-primary/10 flex items-center justify-center"><CalendarDays className="h-8 w-8 text-primary/70" /></div>
                          )}
                          <div className="p-4 space-y-1.5">
                            <p className="font-bold text-sm line-clamp-2">{ev.title}</p>
                            <p className="text-xs font-semibold text-primary">{ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date à confirmer'}</p>
                            {ev.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {/* Products */}
                {!productsLoading && filteredProducts.length > 0 && (
                  <section>
                    <SectionHeader icon={<ShoppingBag className="h-4 w-4 text-primary" />} title="Store" action={{ label: 'View all', onClick: () => setTab('store') }} />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredProducts.slice(0, 6).map((p, i) => (
                        <motion.div key={p.id} variants={staggerItem}>
                          <ProductCard product={p} index={i} onPurchase={() => setBuyProduct(p)} isPurchased={purchasedProductIds.has(p.id)} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {/* Campaigns */}
                {!campaignsLoading && filteredCampaigns.length > 0 && (
                  <section>
                    <SectionHeader icon={<Heart className="h-4 w-4 text-destructive" />} title="Donation Campaigns" action={{ label: 'View all', onClick: () => setTab('campaigns') }} />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredCampaigns.slice(0, 6).map((c, i) => (
                        <motion.div key={c.id} variants={staggerItem}>
                          <CampaignCard campaign={c} index={i} onDonate={() => setDonateCampaign(c)} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {/* Photos */}
                <FeedPhotoSlider orgIds={orgIds} />

                {/* Latest content */}
                <section>
                  <SectionHeader icon={<TrendingUp className="h-4 w-4 text-primary" />} title="Latest Content" action={filteredMedia.length > 6 ? { label: 'View all', onClick: () => setTab('media') } : undefined} />
                  {mediaLoading ? <SkeletonList count={6} /> : filteredMedia.length === 0 ? <EmptyState variant="content" /> : (
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMedia.slice(0, 6).map((m, i) => (
                        <motion.div key={m.id} variants={staggerItem}>
                          <MediaCard media={m} index={i} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>
              </>
            )}

            {/* TAB: MEDIA */}
            {tab === 'media' && <section><MediaTypeFilter allMedia={filteredMedia} /></section>}

            {/* TAB: STORE */}
            {tab === 'store' && (
              <section>
                <SectionHeader icon={<ShoppingBag className="h-4 w-4 text-primary" />} title="Store" />
                {productsLoading ? <SkeletonList count={4} /> : filteredProducts.length === 0 ? <EmptyState variant="generic" title="No products" description="Organizations you follow haven't published products yet." /> : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((p, i) => (
                      <motion.div key={p.id} variants={staggerItem}>
                        <ProductCard product={p} index={i} onPurchase={() => setBuyProduct(p)} isPurchased={purchasedProductIds.has(p.id)} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </section>
            )}

            {/* TAB: CAMPAIGNS */}
            {tab === 'campaigns' && (
              <section>
                <SectionHeader icon={<Heart className="h-4 w-4 text-destructive" />} title="Donation Campaigns" />
                {campaignsLoading ? <SkeletonList count={4} /> : filteredCampaigns.length === 0 ? <EmptyState variant="campaigns" /> : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCampaigns.map((c, i) => (
                      <motion.div key={c.id} variants={staggerItem}>
                        <CampaignCard campaign={c} index={i} onDonate={() => setDonateCampaign(c)} />
                      </motion.div>
                    ))}
                  </motion.div>
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
                        <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">Annonces</p>
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                          {filteredAnnouncements.map((a) => (
                            <motion.div key={a.id} variants={staggerItem} className="flex gap-3 items-start bg-card border border-border rounded-2xl p-4 hover:shadow-elevated transition-all duration-300">
                              {a.image_url ? <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0"><img src={a.image_url} alt={a.title} className="w-full h-full object-cover" /></div> : <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-6 w-6 text-primary" /></div>}
                              <div className="min-w-0">
                                {a.is_pinned && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Épinglé · </span>}
                                <p className="font-bold text-sm line-clamp-1">{a.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.body}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}
                    <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">Événements</p>
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredEvents.map((ev) => (
                        <motion.div key={ev.id} variants={staggerItem} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                          {ev.image_url ? <div className="h-44 overflow-hidden"><img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div> : <div className="h-28 bg-primary/10 flex items-center justify-center"><CalendarDays className="h-10 w-10 text-primary/60" /></div>}
                          <div className="p-5 space-y-2">
                            <p className="font-bold text-base line-clamp-2">{ev.title}</p>
                            {ev.event_date && <p className="text-sm font-semibold text-primary">{new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                            {ev.location && <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{ev.location}</p>}
                            {ev.description && <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{ev.description}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="font-bold text-base">{title}</h2>
      </div>
      {action && <button onClick={action.onClick} className="text-sm text-primary font-semibold hover:underline underline-offset-4">{action.label} →</button>}
    </div>
  );
}

function MediaTypeFilter({ allMedia }: { allMedia: ReturnType<typeof useFeedMedia>['data'] }) {
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const MEDIA_FILTERS = [
    { value: 'all', label: 'Tout', icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { value: 'video', label: 'Vidéos', icon: <Play className="h-3.5 w-3.5" /> },
    { value: 'audio', label: 'Audio', icon: <Headphones className="h-3.5 w-3.5" /> },
    { value: 'reel', label: 'Reels', icon: <Film className="h-3.5 w-3.5" /> },
  ];
  const filtered = (allMedia || []).filter((m) => mediaFilter === 'all' || m.media_type === mediaFilter);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {MEDIA_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setMediaFilter(f.value)} className={cn('shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all', mediaFilter === f.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground bg-card hover:text-foreground')}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState variant="content" /> : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <motion.div key={m.id} variants={staggerItem}>
              <MediaCard media={m} index={i} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
