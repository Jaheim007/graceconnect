import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Megaphone, CalendarDays, ShoppingBag, Heart,
  Play, Headphones, Film, TrendingUp, MapPin,
  Rocket, Eye, Users, Compass,
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
import { useI18n } from '@/i18n/I18nContext';
import { PageTour } from '@/components/onboarding/PageTour';
import { Home } from 'lucide-react';

type Tab = 'all' | 'media' | 'store' | 'campaigns' | 'events';

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } } as const;
const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

export default function FeedPage() {
  const navigate = useNavigate();
  const { userOrgs } = useOrg();
  const orgIds = userOrgs.map((o) => o.id);
  const { t } = useI18n();

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

  const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: t('feed.all'), icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { value: 'media', label: t('feed.media'), icon: <Play className="h-3.5 w-3.5" /> },
    { value: 'store', label: t('feed.store'), icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    { value: 'campaigns', label: t('feed.campaigns'), icon: <Heart className="h-3.5 w-3.5" /> },
    { value: 'events', label: t('feed.events'), icon: <CalendarDays className="h-3.5 w-3.5" /> },
  ];

  const MEDIA_FILTERS = [
    { value: 'all', label: t('feed.all_media'), icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { value: 'video', label: t('feed.videos'), icon: <Play className="h-3.5 w-3.5" /> },
    { value: 'audio', label: t('feed.audio'), icon: <Headphones className="h-3.5 w-3.5" /> },
    { value: 'reel', label: t('feed.reels'), icon: <Film className="h-3.5 w-3.5" /> },
  ];

  if (userOrgs.length === 0) {
    const actions = [
      { icon: <Rocket className="h-6 w-6" />, label: t('feed.action_create_org'), desc: t('feed.action_create_org_desc'), onClick: () => navigate('/create-org'), primary: true },
      { icon: <Eye className="h-6 w-6" />, label: t('feed.action_browse_content'), desc: t('feed.action_browse_content_desc'), onClick: () => navigate('/marketplace') },
    ];

    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg px-4 py-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t('feed.welcome')}</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t('feed.welcome_desc')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid gap-3"
          >
            {actions.map((a, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                onClick={a.onClick}
                className={cn(
                  'flex items-center gap-4 w-full p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5',
                  a.primary
                    ? 'bg-primary/10 border-primary/30 hover:bg-primary/15 hover:shadow-elevated'
                    : 'bg-card border-border hover:bg-accent/50 hover:shadow-card'
                )}
              >
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                  a.primary ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {a.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center pt-2">
            <p className="text-xs text-muted-foreground">{t('feed.tip')}</p>
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

  const dateLocale = document.documentElement.lang === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl px-4 py-5 sm:py-6 space-y-5 sm:space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{t('page.my_network')}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t('page.my_network_desc')}
              </p>
            </div>
          </div>

          <PageTour pageId="network" steps={[
            { titleKey: 'tour.network_1_title', descKey: 'tour.network_1_desc', icon: <Home className="h-4 w-4" /> },
            { titleKey: 'tour.network_2_title', descKey: 'tour.network_2_desc', icon: <Search className="h-4 w-4" /> },
          ]} />
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
          </div>
        </motion.div>

        {!announcementsLoading && announcements.some((a) => a.is_pinned) && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex gap-3 items-start backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5 text-primary" /></div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('feed.pinned')}</span>
              <p className="font-bold text-sm mt-0.5 line-clamp-1">{announcements.find((a) => a.is_pinned)?.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcements.find((a) => a.is_pinned)?.body}</p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)} className={cn(
              'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border',
              tab === t.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 bg-card'
            )}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-10">
            {tab === 'all' && (
              <>
                {!announcementsLoading && filteredAnnouncements.length > 0 && (
                  <section>
                    <SectionHeader icon={<Megaphone className="h-4 w-4 text-primary" />} title={t('feed.announcements')} />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                      {filteredAnnouncements.slice(0, 6).map((a) => (
                        <motion.div key={a.id} variants={staggerItem} className="shrink-0 w-72 bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                          {a.image_url && <div className="h-36 overflow-hidden"><img src={a.image_url} alt={a.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>}
                          <div className="p-4">
                            {a.is_pinned && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{t('feed.pinned')}</span>}
                            <h3 className="font-bold text-sm mt-1 line-clamp-2">{a.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{a.body}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {!eventsLoading && filteredEvents.length > 0 && (
                  <section>
                    <SectionHeader icon={<CalendarDays className="h-4 w-4 text-accent" />} title={t('feed.upcoming_events')} />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                      {filteredEvents.map((ev) => (
                        <motion.div key={ev.id} variants={staggerItem} className="shrink-0 w-64 bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                          {ev.image_url ? <div className="h-36 overflow-hidden"><img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div> : <div className="h-24 bg-primary/10 flex items-center justify-center"><CalendarDays className="h-8 w-8 text-primary/70" /></div>}
                          <div className="p-4 space-y-1.5">
                            <p className="font-bold text-sm line-clamp-2">{ev.title}</p>
                            <p className="text-xs font-semibold text-primary">{ev.event_date ? new Date(ev.event_date).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' }) : t('feed.date_tbc')}</p>
                            {ev.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {!productsLoading && filteredProducts.length > 0 && (
                  <section>
                    <SectionHeader icon={<ShoppingBag className="h-4 w-4 text-primary" />} title={t('feed.store')} action={{ label: t('common.view_all'), onClick: () => setTab('store') }} />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredProducts.slice(0, 6).map((p, i) => (
                        <motion.div key={p.id} variants={staggerItem}><ProductCard product={p} index={i} onPurchase={() => setBuyProduct(p)} isPurchased={purchasedProductIds.has(p.id)} /></motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                {!campaignsLoading && filteredCampaigns.length > 0 && (
                  <section>
                    <SectionHeader icon={<Heart className="h-4 w-4 text-destructive" />} title={t('feed.donation_campaigns')} action={{ label: t('common.view_all'), onClick: () => setTab('campaigns') }} />
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredCampaigns.slice(0, 6).map((c, i) => (
                        <motion.div key={c.id} variants={staggerItem}><CampaignCard campaign={c} index={i} onDonate={() => setDonateCampaign(c)} /></motion.div>
                      ))}
                    </motion.div>
                  </section>
                )}

                <FeedPhotoSlider orgIds={orgIds} />

                <section>
                  <SectionHeader icon={<TrendingUp className="h-4 w-4 text-primary" />} title={t('feed.latest_content')} action={filteredMedia.length > 6 ? { label: t('common.view_all'), onClick: () => setTab('media') } : undefined} />
                  {mediaLoading ? <SkeletonList count={6} /> : filteredMedia.length === 0 ? <EmptyState variant="content" /> : (
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMedia.slice(0, 6).map((m, i) => (
                        <motion.div key={m.id} variants={staggerItem}><MediaCard media={m} index={i} /></motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>
              </>
            )}

            {tab === 'media' && <section><MediaTypeFilter allMedia={filteredMedia} filters={MEDIA_FILTERS} /></section>}

            {tab === 'store' && (
              <section>
                <SectionHeader icon={<ShoppingBag className="h-4 w-4 text-primary" />} title={t('feed.store')} />
                {productsLoading ? <SkeletonList count={4} /> : filteredProducts.length === 0 ? <EmptyState variant="generic" title={t('feed.no_products')} description={t('feed.no_products_desc')} /> : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((p, i) => (
                      <motion.div key={p.id} variants={staggerItem}><ProductCard product={p} index={i} onPurchase={() => setBuyProduct(p)} isPurchased={purchasedProductIds.has(p.id)} /></motion.div>
                    ))}
                  </motion.div>
                )}
              </section>
            )}

            {tab === 'campaigns' && (
              <section>
                <SectionHeader icon={<Heart className="h-4 w-4 text-destructive" />} title={t('feed.donation_campaigns')} />
                {campaignsLoading ? <SkeletonList count={4} /> : filteredCampaigns.length === 0 ? <EmptyState variant="campaigns" /> : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCampaigns.map((c, i) => (
                      <motion.div key={c.id} variants={staggerItem}><CampaignCard campaign={c} index={i} onDonate={() => setDonateCampaign(c)} /></motion.div>
                    ))}
                  </motion.div>
                )}
              </section>
            )}

            {tab === 'events' && (
              <section>
                <SectionHeader icon={<CalendarDays className="h-4 w-4 text-accent" />} title={t('feed.upcoming_events')} />
                {eventsLoading ? <SkeletonList count={4} /> : filteredEvents.length === 0 ? <EmptyState variant="generic" title={t('feed.no_events')} description={t('feed.no_events_desc')} /> : (
                  <>
                    {filteredAnnouncements.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">{t('feed.announcements')}</p>
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                          {filteredAnnouncements.map((a) => (
                            <motion.div key={a.id} variants={staggerItem} className="flex gap-3 items-start bg-card border border-border rounded-2xl p-4 hover:shadow-elevated transition-all duration-300">
                              {a.image_url ? <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0"><img src={a.image_url} alt={a.title} className="w-full h-full object-cover" /></div> : <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-6 w-6 text-primary" /></div>}
                              <div className="min-w-0">
                                {a.is_pinned && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{t('feed.pinned')} · </span>}
                                <p className="font-bold text-sm line-clamp-1">{a.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.body}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}
                    <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">{t('feed.events')}</p>
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredEvents.map((ev) => (
                        <motion.div key={ev.id} variants={staggerItem} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                          {ev.image_url ? <div className="h-44 overflow-hidden"><img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div> : <div className="h-28 bg-primary/10 flex items-center justify-center"><CalendarDays className="h-10 w-10 text-primary/60" /></div>}
                          <div className="p-5 space-y-2">
                            <p className="font-bold text-base line-clamp-2">{ev.title}</p>
                            {ev.event_date && <p className="text-sm font-semibold text-primary">{new Date(ev.event_date).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
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
      <div className="flex items-center gap-2.5">{icon}<h2 className="font-bold text-base">{title}</h2></div>
      {action && <button onClick={action.onClick} className="text-sm text-primary font-semibold hover:underline underline-offset-4">{action.label} →</button>}
    </div>
  );
}

function MediaTypeFilter({ allMedia, filters }: { allMedia: ReturnType<typeof useFeedMedia>['data']; filters: { value: string; label: string; icon: React.ReactNode }[] }) {
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const filtered = (allMedia || []).filter((m) => mediaFilter === 'all' || m.media_type === mediaFilter);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setMediaFilter(f.value)} className={cn('shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all', mediaFilter === f.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground bg-card hover:text-foreground')}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState variant="content" /> : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <motion.div key={m.id} variants={staggerItem}><MediaCard media={m} index={i} /></motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
