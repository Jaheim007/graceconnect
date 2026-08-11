import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Calendar, Ticket, Gift, Wrench, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { showServiceSurfaces } from '@/lib/siteviral/visibility';

/**
 * PersonalActivityPage — a customer-facing aggregation layer.
 * Each tab reads from the vertical's real source-of-truth table and links
 * back to the existing detail page. We never migrate data or force a shared
 * status model on top of it.
 *
 * Sources connected:
 *  - Purchases / Library   → product_purchases + digital_products
 *  - Bookings              → beauty_bookings, home_bookings, education_bookings
 *  - Tickets               → events_bookings
 *  - Giving                → donations
 *
 * Deferred (no reliable per-buyer source yet):
 *  - "Service Orders" tab currently mirrors Bookings for beauty/home; when a
 *    dedicated services orders table exists, wire it here without touching
 *    other tabs.
 */

type Tab = 'purchases' | 'orders' | 'bookings' | 'tickets' | 'giving';

export default function PersonalActivityPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [params, setParams] = useSearchParams();
  const services = showServiceSurfaces();
  const requested = (params.get('tab') as Tab) || 'purchases';
  const active: Tab =
    !services && ['orders', 'bookings', 'tickets'].includes(requested) ? 'purchases' : requested;


  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    setParams(next, { replace: true });
  };

  return (
    <div className="native-page-screen bg-background">
      <SEOHead
        title={isFr ? 'Mon activité — SiteViral' : 'My activity — SiteViral'}
        description={isFr ? 'Achats, réservations et billets' : 'Purchases, bookings and tickets'}
      />

      <div className="border-b border-border py-5 px-4">
        <div className="container max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-bold">{isFr ? 'Mon activité' : 'My activity'}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isFr
              ? services
                ? 'Tous vos achats, réservations, billets et dons au même endroit.'
                : 'Tous vos achats et dons au même endroit.'
              : services
                ? 'All your purchases, bookings, tickets and giving in one place.'
                : 'All your purchases and giving in one place.'}
          </p>
        </div>
      </div>

      <div className="container max-w-4xl px-4 py-6">
        <Tabs value={active} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className={cn('w-full grid h-auto', services ? 'grid-cols-5' : 'grid-cols-2')}>
            <TabsTrigger value="purchases" className="text-[11px] sm:text-xs py-2">
              {isFr ? 'Achats' : 'Purchases'}
            </TabsTrigger>
            {services && (
              <>
                <TabsTrigger value="orders" className="text-[11px] sm:text-xs py-2">
                  {isFr ? 'Services' : 'Services'}
                </TabsTrigger>
                <TabsTrigger value="bookings" className="text-[11px] sm:text-xs py-2">
                  {isFr ? 'Rendez-vous' : 'Bookings'}
                </TabsTrigger>
                <TabsTrigger value="tickets" className="text-[11px] sm:text-xs py-2">
                  {isFr ? 'Billets' : 'Tickets'}
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="giving" className="text-[11px] sm:text-xs py-2">
              {isFr ? 'Dons' : 'Giving'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="mt-5">
            <PurchasesTab userId={user?.id} isFr={isFr} />
          </TabsContent>
          {services && (
            <>
              <TabsContent value="orders" className="mt-5">
                <ServiceOrdersTab userId={user?.id} isFr={isFr} />
              </TabsContent>
              <TabsContent value="bookings" className="mt-5">
                <BookingsTab userId={user?.id} isFr={isFr} />
              </TabsContent>
              <TabsContent value="tickets" className="mt-5">
                <TicketsTab userId={user?.id} isFr={isFr} />
              </TabsContent>
            </>
          )}
          <TabsContent value="giving" className="mt-5">
            <GivingTab userId={user?.id} isFr={isFr} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

// ─── Purchases / Library ───────────────────────────────────────────────

function PurchasesTab({ userId, isFr }: { userId?: string; isFr: boolean }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['activity-purchases', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('product_purchases')
        .select('id, created_at, status, digital_products(title, cover_image_url, product_type, slug, organization_id)')
        .eq('user_id', userId!)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  if (isLoading) return <ListSkeleton />;
  if (data.length === 0)
    return (
      <Empty
        icon={Package}
        title={isFr ? 'Aucun achat digital' : 'No digital purchases'}
        hint={isFr ? 'Vos produits achetés apparaîtront ici.' : 'Your purchased products will appear here.'}
        cta={{ label: isFr ? 'Découvrir des produits' : 'Discover products', to: '/dashboard/explore?world=digital' }}
      />
    );

  return (
    <div className="space-y-2">
      {data.map((p: any) => (
        <Link
          key={p.id}
          to="/my-purchases?tab=courses"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center overflow-hidden shrink-0">
            {p.digital_products?.cover_image_url ? (
              <img src={p.digital_products.cover_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">
              {p.digital_products?.title || (isFr ? 'Produit' : 'Product')}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(p.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
            </div>
          </div>
          <span className="text-[10px] font-medium rounded-full bg-primary/10 text-primary px-2 py-1 shrink-0">
            {isFr ? 'Ouvrir' : 'Open'}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ─── Service Orders (beauty + home providers, completed/in progress) ───

function ServiceOrdersTab({ userId, isFr }: { userId?: string; isFr: boolean }) {
  const { data: beauty = [] } = useQuery({
    queryKey: ['activity-service-beauty', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('beauty_bookings')
        .select('id, slot_start, status, price_xof, currency')
        .eq('client_id', userId!)
        .in('status', ['in_progress', 'completed'])
        .order('slot_start', { ascending: false });
      return data || [];
    },
  });
  const { data: home = [] } = useQuery({
    queryKey: ['activity-service-home', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('home_bookings')
        .select('id, scheduled_for, status, price, currency')
        .eq('client_id', userId!)
        .in('status', ['in_progress', 'completed'])
        .order('scheduled_for', { ascending: false, nullsFirst: false });
      return data || [];
    },
  });

  const items = useMemo(
    () => [
      ...beauty.map((b: any) => ({
        id: `b-${b.id}`, kind: 'beauty' as const, when: b.slot_start, status: b.status,
        to: `/beauty/bookings/${b.id}`, label: isFr ? 'Beauté' : 'Beauty', emoji: '💅',
      })),
      ...home.map((b: any) => ({
        id: `h-${b.id}`, kind: 'home' as const, when: b.scheduled_for, status: b.status,
        to: `/home/bookings/${b.id}`, label: isFr ? 'Artisan' : 'Artisan', emoji: '🛠️',
      })),
    ].sort((a, b) => (new Date(b.when || 0).getTime() - new Date(a.when || 0).getTime())),
    [beauty, home, isFr],
  );

  if (items.length === 0)
    return (
      <Empty
        icon={Wrench}
        title={isFr ? 'Aucun service en cours' : 'No service orders yet'}
        hint={isFr ? 'Les prestations en cours ou terminées apparaîtront ici.' : 'In-progress and completed services show up here.'}
        cta={{ label: isFr ? 'Trouver un pro' : 'Find a pro', to: '/dashboard/explore' }}
      />
    );

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <Link key={it.id} to={it.to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition">
          <div className="h-11 w-11 rounded-xl bg-muted grid place-items-center text-lg shrink-0">{it.emoji}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{it.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {it.when ? new Date(it.when).toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'} · <span className="uppercase">{it.status}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// ─── Bookings (upcoming across beauty / home / education) ──────────────

function BookingsTab({ userId, isFr }: { userId?: string; isFr: boolean }) {
  const { data: beauty = [] } = useQuery({
    queryKey: ['activity-bookings-beauty', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('beauty_bookings')
        .select('id, slot_start, status')
        .eq('client_id', userId!)
        .in('status', ['pending_payment', 'confirmed'])
        .order('slot_start', { ascending: true });
      return data || [];
    },
  });
  const { data: home = [] } = useQuery({
    queryKey: ['activity-bookings-home', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('home_bookings')
        .select('id, scheduled_for, status')
        .eq('client_id', userId!)
        .in('status', ['pending_payment', 'confirmed'])
        .order('scheduled_for', { ascending: true, nullsFirst: false });
      return data || [];
    },
  });
  const { data: education = [] } = useQuery({
    queryKey: ['activity-bookings-education', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('education_bookings')
        .select('id, scheduled_at, status, subject')
        .eq('student_id', userId!)
        .order('scheduled_at', { ascending: true });
      return data || [];
    },
  });

  const items = useMemo(
    () => [
      ...beauty.map((b: any) => ({ id: `b-${b.id}`, when: b.slot_start, status: b.status, to: `/beauty/bookings/${b.id}`, label: isFr ? 'Beauté' : 'Beauty', emoji: '💅' })),
      ...home.map((b: any) => ({ id: `h-${b.id}`, when: b.scheduled_for, status: b.status, to: `/home/bookings/${b.id}`, label: isFr ? 'Artisan' : 'Artisan', emoji: '🛠️' })),
      ...education.map((b: any) => ({ id: `e-${b.id}`, when: b.scheduled_at, status: b.status, to: `/dashboard/activity?tab=bookings`, label: b.subject || (isFr ? 'Cours' : 'Session'), emoji: '📚' })),
    ].sort((a, b) => (new Date(a.when || 0).getTime() - new Date(b.when || 0).getTime())),
    [beauty, home, education, isFr],
  );

  if (items.length === 0)
    return (
      <Empty
        icon={Calendar}
        title={isFr ? 'Aucune réservation' : 'No bookings yet'}
        hint={isFr ? 'Vos rendez-vous et sessions apparaîtront ici.' : 'Your appointments and sessions will show up here.'}
        cta={{ label: isFr ? 'Explorer' : 'Explore', to: '/dashboard/explore' }}
      />
    );

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <Link key={it.id} to={it.to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition">
          <div className="h-11 w-11 rounded-xl bg-muted grid place-items-center text-lg shrink-0">{it.emoji}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{it.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {it.when ? new Date(it.when).toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : (isFr ? 'À planifier' : 'To schedule')} · <span className="uppercase">{it.status}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// ─── Tickets (events) ──────────────────────────────────────────────────

function TicketsTab({ userId, isFr }: { userId?: string; isFr: boolean }) {
  const { data = [] } = useQuery({
    queryKey: ['activity-tickets', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('events_bookings')
        .select('id, event_date, status, price, currency')
        .eq('client_id', userId!)
        .order('event_date', { ascending: true, nullsFirst: false });
      return data || [];
    },
  });

  if (data.length === 0)
    return (
      <Empty
        icon={Ticket}
        title={isFr ? 'Aucun billet' : 'No tickets yet'}
        hint={isFr ? 'Vos billets d\u2019événements apparaîtront ici.' : 'Your event tickets will show up here.'}
        cta={{ label: isFr ? 'Voir les événements' : 'Browse events', to: '/dashboard/explore?world=events' }}
      />
    );

  return (
    <div className="space-y-2">
      {data.map((b: any) => (
        <Link key={b.id} to={`/dashboard/activity?tab=tickets`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition">
          <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 grid place-items-center text-lg shrink-0">🎉</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{isFr ? 'Événement' : 'Event'}</div>
            <div className="text-[11px] text-muted-foreground">
              {b.event_date ? new Date(b.event_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US') : '—'} · <span className="uppercase">{b.status}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// ─── Giving (donations) ────────────────────────────────────────────────

function GivingTab({ userId, isFr }: { userId?: string; isFr: boolean }) {
  const { data = [] } = useQuery({
    queryKey: ['activity-giving', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await db.from('donations')
        .select('id, amount, currency, created_at, status, donation_campaigns(title), organizations(name)')
        .eq('user_id', userId!)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  if (data.length === 0)
    return (
      <Empty
        icon={Gift}
        title={isFr ? 'Aucun don' : 'No giving yet'}
        hint={isFr ? 'Vos dons apparaîtront ici.' : 'Your donations will show up here.'}
        cta={{ label: isFr ? 'Mes dons' : 'My giving', to: '/my-donations' }}
      />
    );

  return (
    <div className="space-y-2">
      {data.map((d: any) => (
        <Link key={d.id} to="/my-donations" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition">
          <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 grid place-items-center text-lg shrink-0">🎁</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">
              {d.donation_campaigns?.title || d.organizations?.name || (isFr ? 'Don' : 'Donation')}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(d.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')} · {d.amount} {d.currency}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// ─── shared ────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function Empty({
  icon: Icon, title, hint, cta,
}: { icon: any; title: string; hint: string; cta?: { label: string; to: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 flex flex-col items-center text-center gap-3">
      <div className="h-12 w-12 rounded-xl bg-muted grid place-items-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
      </div>
      {cta && (
        <Link
          to={cta.to}
          className={cn(
            'mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition',
          )}
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
