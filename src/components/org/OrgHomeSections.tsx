import type { ReactElement } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { MediaCard } from '@/components/media/MediaCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { ProductCard } from '@/components/products/ProductCard';
import { OfferingCard } from '@/components/offerings/OfferingCard';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Play, Camera, CalendarDays, HandHeart, GraduationCap } from 'lucide-react';
import { DonationCampaign, DigitalProduct } from '@/types/database';
import { Offering } from '@/hooks/useOfferings';
import { EventCountdown } from '@/components/events/EventCountdown';

interface OrgHomeSectionsProps {
  slug: string;
  products: any[];
  campaigns: any[];
  offerings: Offering[];
  media: any[];
  photos: any[];
  events: any[];
  programs: any[];
  purchasedProductIds: Set<string>;
  sectionOrder: string[];
  hiddenSections: Set<string>;
  onPurchase: (p: DigitalProduct) => void;
  onDonate: (c: DonationCampaign) => void;
  onSelectOffering: (o: Offering) => void;
  onPhotoClick: (index: number) => void;
}

export function OrgHomeSections({
  slug, products, campaigns, offerings, media, photos, events, programs,
  purchasedProductIds, sectionOrder, hiddenSections,
  onPurchase, onDonate, onSelectOffering, onPhotoClick,
}: OrgHomeSectionsProps) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const dateFmt = locale === 'fr' ? 'fr-FR' : 'en-US';

  const navigateTab = (tab: string) => {
    const base = `/org/${slug}`;
    navigate(tab === 'home' ? base : `${base}/${tab}`, { replace: true });
  };

  const sectionRenderers: Record<string, () => ReactElement | null> = {
    products: () => products.length > 0 ? (
      <motion.section key="products" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><ShoppingBag className="h-4 w-4 text-primary" /></div>
            <div>
              <h2 className="font-bold text-base">{t('org_public.digital_products')}</h2>
              <p className="text-xs text-muted-foreground">{products.length} {locale === 'fr' ? 'disponible(s)' : 'available'}</p>
            </div>
          </div>
          {products.length > 3 && <Button variant="outline" size="sm" className="text-xs h-8 rounded-full gap-1" onClick={() => navigateTab('store')}>{t('org_public.view_all')} →</Button>}
        </div>
        <div className="px-5 pb-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((p, i) => <ProductCard key={p.id} product={p} index={i} onPurchase={() => onPurchase(p)} isPurchased={purchasedProductIds.has(p.id)} hideCommission hideShare />)}
          </div>
        </div>
      </motion.section>
    ) : null,

    campaigns: () => campaigns.length > 0 ? (
      <motion.section key="campaigns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center"><Heart className="h-4 w-4 text-destructive" /></div>
            <div>
              <h2 className="font-bold text-base">{locale === 'fr' ? 'Campagnes Actives' : 'Active Campaigns'}</h2>
              <p className="text-xs text-muted-foreground">{campaigns.length} {locale === 'fr' ? 'campagne(s)' : 'campaign(s)'}</p>
            </div>
          </div>
          {campaigns.length > 2 && <Button variant="outline" size="sm" className="text-xs h-8 rounded-full gap-1" onClick={() => navigateTab('donate')}>{t('org_public.view_all')} →</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 px-5 pb-5">
          {campaigns.slice(0, 2).map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)}
        </div>
      </motion.section>
    ) : null,

    offerings: () => offerings.length > 0 ? (
      <motion.section key="offerings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><HandHeart className="h-4 w-4 text-primary" /></div>
            <div>
              <h2 className="font-bold text-base">{locale === 'fr' ? 'Dons' : 'Donations'}</h2>
              <p className="text-xs text-muted-foreground">{offerings.length} {locale === 'fr' ? 'type(s)' : 'type(s)'}</p>
            </div>
          </div>
          {offerings.length > 3 && <Button variant="outline" size="sm" className="text-xs h-8 rounded-full gap-1" onClick={() => navigateTab('offerings')}>{t('org_public.view_all')} →</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 px-5 pb-5">
          {offerings.slice(0, 4).map((o) => <OfferingCard key={o.id} offering={o} onSelect={onSelectOffering} />)}
        </div>
      </motion.section>
    ) : null,

    content: () => media.length > 0 ? (
      <motion.section key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Play className="h-4 w-4 text-primary" /></div>
            <div>
              <h2 className="font-bold text-base">{t('org_public.featured_content')}</h2>
              <p className="text-xs text-muted-foreground">{media.length} {locale === 'fr' ? 'contenu(s)' : 'item(s)'}</p>
            </div>
          </div>
          {media.length > 3 && <Button variant="outline" size="sm" className="text-xs h-8 rounded-full gap-1" onClick={() => navigateTab('content')}>{t('org_public.view_all')} →</Button>}
        </div>
        <div className="px-5 pb-5">
          {media.length >= 1 && <div className="mb-4"><MediaCard key={media[0].id} media={media[0]} index={0} /></div>}
          {media.length > 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {media.slice(1, 5).map((m, i) => <MediaCard key={m.id} media={m} index={i + 1} compact />)}
            </div>
          )}
        </div>
      </motion.section>
    ) : null,

    photos: () => photos.length > 0 ? (
      <motion.section key="photos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Camera className="h-4 w-4 text-primary" /></div>
            <h2 className="font-bold text-base">{t('org_public.photos')}</h2>
          </div>
          {photos.length > 4 && <Button variant="outline" size="sm" className="text-xs h-8 rounded-full gap-1" onClick={() => navigateTab('photos')}>{t('org_public.view_all')} →</Button>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-5 pb-5">
          {photos.slice(0, 4).map((photo: any, i: number) => (
            <div key={photo.id} className="rounded-xl overflow-hidden group cursor-pointer aspect-[4/3]" onClick={() => onPhotoClick(i)}>
              <img src={photo.image_url} alt={photo.caption || 'Photo'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </motion.section>
    ) : null,

    events: () => events.length > 0 ? (
      <motion.section key="events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><CalendarDays className="h-4 w-4 text-primary" /></div>
            <h2 className="font-bold text-base">{t('org_public.upcoming_events')}</h2>
          </div>
        </div>
        <div className="space-y-3 px-5 pb-5">
          {events.slice(0, 3).map((ev) => (
            <div key={ev.id} className="rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer overflow-hidden" onClick={() => navigate(`/event/${ev.id}`)}>
              {/* Event image/banner */}
              {ev.image_url && (
                <div className="aspect-video w-full overflow-hidden">
                  <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                </div>
              )}
              {/* Countdown overlay for events with images */}
              {ev.event_date && new Date(ev.event_date) > new Date() && (
                <div className="px-3 pt-3">
                  <EventCountdown endDate={ev.event_date} />
                </div>
              )}
              <div className="flex items-center gap-3 p-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                  {ev.event_date ? (
                    <>
                      <span className="text-[10px] font-bold text-primary uppercase">{new Date(ev.event_date).toLocaleDateString(dateFmt, { month: 'short' })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(ev.event_date).getDate()}</span>
                    </>
                  ) : (
                    <CalendarDays className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.event_date ? new Date(ev.event_date).toLocaleDateString(dateFmt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : t('org_public.date_tbc')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    ) : null,

    programs: () => programs.length > 0 ? (
      <motion.section key="programs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.28 }} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap className="h-4 w-4 text-primary" /></div>
            <div>
              <h2 className="font-bold text-base">{locale === 'fr' ? 'Formations' : 'Programs'}</h2>
              <p className="text-xs text-muted-foreground">{programs.length} {locale === 'fr' ? 'formation(s)' : 'program(s)'}</p>
            </div>
          </div>
          {programs.length > 3 && <Button variant="outline" size="sm" className="text-xs h-8 rounded-full gap-1" onClick={() => navigateTab('programs')}>{t('org_public.view_all')} →</Button>}
        </div>
        <div className="space-y-2 px-5 pb-5">
          {programs.slice(0, 3).map((prog: any) => (
            <div key={prog.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => navigate(`/program/${prog.id}`)}>
              {prog.cover_image_url ? (
                <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                  <img src={prog.cover_image_url} alt={prog.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{prog.title}</p>
                <p className="text-xs text-muted-foreground">{prog.module_count || 0} {locale === 'fr' ? 'module(s)' : 'module(s)'}{prog.price > 0 ? ` · ${prog.price} ${prog.currency || 'XOF'}` : locale === 'fr' ? ' · Gratuit' : ' · Free'}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    ) : null,
  };

  const sections = sectionOrder
    .filter(s => !hiddenSections.has(s) && sectionRenderers[s])
    .map(s => sectionRenderers[s]())
    .filter(Boolean);

  return <>{sections}</>;
}
