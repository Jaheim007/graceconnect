import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Calendar, Ticket, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { BUYER_WORLDS, SERVICE_WORLDS } from '@/lib/siteviral/buyerWorlds';
import { cn } from '@/lib/utils';

/**
 * PersonalHome — the signed-in customer overview shown when currentOrg is null.
 * Mobile-first. Reuses existing data sources (product_purchases, beauty/home/
 * events/education bookings, donations). Empty states are honest; no fake data.
 */
export default function PersonalHome() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/dashboard/explore?q=${encodeURIComponent(q)}` : '/dashboard/explore');
  };

  // Recent digital purchases
  const { data: purchases = [] } = useQuery({
    queryKey: ['personal-home-purchases', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from('product_purchases')
        .select('id, created_at, digital_products(title, cover_image_url, slug, organization_id)')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  // Upcoming bookings across verticals (best-effort, each isolated)
  const { data: beautyUpcoming = [] } = useQuery({
    queryKey: ['personal-home-beauty', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from('beauty_bookings')
        .select('id, slot_start, status')
        .eq('client_id', user!.id)
        .gte('slot_start', new Date().toISOString())
        .in('status', ['pending_payment', 'confirmed'])
        .order('slot_start', { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  const { data: homeUpcoming = [] } = useQuery({
    queryKey: ['personal-home-home-bookings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from('home_bookings')
        .select('id, scheduled_for, status')
        .eq('client_id', user!.id)
        .in('status', ['pending_payment', 'confirmed'])
        .order('scheduled_for', { ascending: true, nullsFirst: false })
        .limit(3);
      return data || [];
    },
  });

  const { data: educationUpcoming = [] } = useQuery({
    queryKey: ['personal-home-education', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from('education_bookings')
        .select('id, scheduled_at, status, subject')
        .eq('student_id', user!.id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  const { data: eventsUpcoming = [] } = useQuery({
    queryKey: ['personal-home-events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from('events_bookings')
        .select('id, event_date, status')
        .eq('client_id', user!.id)
        .in('status', ['pending_payment', 'confirmed'])
        .order('event_date', { ascending: true, nullsFirst: false })
        .limit(3);
      return data || [];
    },
  });

  const upcomingCount =
    beautyUpcoming.length + homeUpcoming.length + educationUpcoming.length + eventsUpcoming.length;

  const displayName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    (isFr ? 'là' : 'there');

  return (
    <div className="native-page-screen bg-background">
      <SEOHead
        title={isFr ? 'Accueil — SiteViral' : 'Home — SiteViral'}
        description={isFr ? 'Votre compte SiteViral' : 'Your SiteViral account'}
      />

      <div className="container max-w-3xl px-4 py-5 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {isFr ? `Bonjour ${displayName} 👋` : `Hi ${displayName} 👋`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Que cherchez-vous aujourd\u2019hui ?' : 'What are you looking for today?'}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isFr ? 'Rechercher services, produits, artisans…' : 'Search services, products, artisans…'}
            className="pl-10 h-12 bg-card/80 rounded-2xl"
          />
        </form>

        {/* Category shortcuts (marketplace, excludes church) */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {isFr ? 'Catégories' : 'Categories'}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SERVICE_WORLDS.map((w) => {
              const meta = BUYER_WORLDS[w];
              return (
                <Link
                  key={w}
                  to={`/dashboard/explore?world=${w}`}
                  className="rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:-translate-y-0.5 transition"
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[11px] font-medium text-center leading-tight">
                    {isFr ? meta.labelFr : meta.labelEn}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Upcoming bookings summary — service marketplace only */}
        {showServiceSurfaces() && (
        <section className="space-y-3">

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {isFr ? 'À venir' : 'Upcoming'}
            </h2>
            <Link to="/dashboard/activity?tab=bookings" className="text-xs text-primary font-medium hover:underline">
              {isFr ? 'Tout voir' : 'See all'}
            </Link>
          </div>
          {upcomingCount === 0 ? (
            <EmptyRow
              icon={Calendar}
              title={isFr ? 'Aucun rendez-vous à venir' : 'No upcoming bookings'}
              hint={isFr ? 'Trouvez un pro dans Explorer' : 'Find a pro in Explore'}
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {beautyUpcoming.map((b: any) => (
                <UpcomingCard
                  key={`b-${b.id}`}
                  label={isFr ? 'Beauté' : 'Beauty'}
                  when={new Date(b.slot_start)}
                  to="/dashboard/activity?tab=bookings"
                  color="bg-pink-500/10 text-pink-600"
                  emoji="💅"
                  isFr={isFr}
                />
              ))}
              {homeUpcoming.map((b: any) => (
                <UpcomingCard
                  key={`h-${b.id}`}
                  label={isFr ? 'Artisan' : 'Artisan'}
                  when={b.scheduled_for ? new Date(b.scheduled_for) : null}
                  to="/dashboard/activity?tab=bookings"
                  color="bg-orange-500/10 text-orange-600"
                  emoji="🛠️"
                  isFr={isFr}
                />
              ))}
              {educationUpcoming.map((b: any) => (
                <UpcomingCard
                  key={`e-${b.id}`}
                  label={b.subject || (isFr ? 'Cours' : 'Session')}
                  when={new Date(b.scheduled_at)}
                  to="/dashboard/activity?tab=bookings"
                  color="bg-teal-500/10 text-teal-600"
                  emoji="📚"
                  isFr={isFr}
                />
              ))}
              {eventsUpcoming.map((b: any) => (
                <UpcomingCard
                  key={`ev-${b.id}`}
                  label={isFr ? 'Événement' : 'Event'}
                  when={b.event_date ? new Date(b.event_date) : null}
                  to="/dashboard/activity?tab=tickets"
                  color="bg-purple-500/10 text-purple-600"
                  emoji="🎉"
                  isFr={isFr}
                />
              ))}
            </div>
          )}
        </section>
        )}


        {/* Recent digital purchases */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {isFr ? 'Achats récents' : 'Recent purchases'}
            </h2>
            <Link to="/dashboard/activity?tab=purchases" className="text-xs text-primary font-medium hover:underline">
              {isFr ? 'Ma bibliothèque' : 'My library'}
            </Link>
          </div>
          {purchases.length === 0 ? (
            <EmptyRow
              icon={Package}
              title={isFr ? 'Aucun achat pour l\u2019instant' : 'No purchases yet'}
              hint={isFr ? 'Découvrez des produits digitaux' : 'Discover digital products'}
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {purchases.map((p: any) => (
                <Link
                  key={p.id}
                  to="/my-programs"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center overflow-hidden shrink-0">
                    {p.digital_products?.cover_image_url ? (
                      <img
                        src={p.digital_products.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Discover CTA */}
        <section>
          <Link
            to="/dashboard/explore"
            className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {isFr ? 'Explorer la marketplace' : 'Explore the marketplace'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isFr ? 'Produits, services, artisans, formations, événements' : 'Products, services, artisans, courses, events'}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function EmptyRow({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-5 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

function UpcomingCard({
  label, when, to, color, emoji, isFr,
}: { label: string; when: Date | null; to: string; color: string; emoji: string; isFr: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition">
      <div className={cn('h-10 w-10 rounded-xl grid place-items-center text-lg', color)}>{emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{label}</div>
        <div className="text-[11px] text-muted-foreground">
          {when
            ? when.toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
            : (isFr ? 'À planifier' : 'To schedule')}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
