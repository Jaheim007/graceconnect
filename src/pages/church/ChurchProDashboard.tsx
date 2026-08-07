import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Church, Mic, HandHeart, Calendar, Heart, Users, Settings, ShieldCheck, ShieldAlert, ExternalLink, Loader2, Zap, ArrowUpRight, CalendarClock, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';

export default function ChurchProDashboard() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  useEffect(() => {
    document.title = fr ? 'Tableau de bord — SiteViral Church' : 'Dashboard — SiteViral Church';
  }, [fr]);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ['church-dashboard', user?.id],
    queryFn: async () => {
      const { data: church, error } = await supabase
        .from('church_providers')
        .select('id, slug, name, status, verified, payout_verified, is_official, logo_url, cover_url, kyc_submission_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!church) return { church: null, counts: { sermons: 0, campaigns: 0, events: 0, prayers: 0 } };

      const [sermons, campaigns, events, prayers, appointments] = await Promise.all([
        supabase.from('church_sermons').select('id', { count: 'exact', head: true }).eq('church_id', church.id),
        supabase.from('church_campaigns').select('id', { count: 'exact', head: true }).eq('church_id', church.id),
        supabase.from('church_events').select('id', { count: 'exact', head: true }).eq('church_id', church.id),
        supabase.from('church_prayer_requests').select('id', { count: 'exact', head: true }).eq('church_id', church.id).eq('status', 'new'),
        supabase.from('church_appointments').select('id', { count: 'exact', head: true }).eq('church_id', church.id).eq('status', 'new'),
      ]);
      return {
        church,
        counts: {
          sermons: sermons.count ?? 0,
          campaigns: campaigns.count ?? 0,
          events: events.count ?? 0,
          prayers: prayers.count ?? 0,
          appointments: appointments.count ?? 0,
        },
      };
    },
  });

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth?returnTo=/dashboard" replace />;
  if (!data?.church) return <Navigate to="/church/pro/onboarding" replace />;

  const { church, counts } = data;
  const payoutVerified = !!church.payout_verified;

  const stats = [
    { label: fr ? 'Prédications' : 'Sermons', value: counts.sermons, icon: Mic },
    { label: fr ? 'Campagnes' : 'Campaigns', value: counts.campaigns, icon: HandHeart },
    { label: fr ? 'Événements' : 'Events', value: counts.events, icon: Calendar },
    { label: fr ? 'Prières nouvelles' : 'New prayers', value: counts.prayers, icon: Heart },
    { label: fr ? 'RDV en attente' : 'Pending appts', value: counts.appointments, icon: CalendarClock },
  ];

  const quickLinks = [
    { to: '/admin/church/sermons', icon: Mic, title: fr ? 'Prédications → Livre' : 'Sermons → Book', desc: fr ? 'Uploader audio, transcrire, transformer en livre/PDF' : 'Upload audio, transcribe, transform to book/PDF', badge: null},
    { to: '/admin/church/giving', icon: HandHeart, title: fr ? 'Dîmes & offrandes' : 'Tithes & offerings', desc: fr ? 'Dons, campagnes, reçus' : 'Gifts, campaigns, receipts' },
    { to: '/admin/church/campaigns', icon: HandHeart, title: fr ? 'Campagnes' : 'Campaigns', desc: fr ? 'Collectes ciblées avec objectif' : 'Targeted fundraisers with a goal' },
    { to: '/admin/church/events', icon: Ticket, title: fr ? 'Événements & billets' : 'Events & tickets', desc: fr ? 'Cultes, conférences, billetterie' : 'Services, conferences, ticketing' },
    { to: '/admin/church/appointments', icon: CalendarClock, title: fr ? 'Rendez-vous pastoraux' : 'Pastoral appointments', desc: fr ? 'Gérer les demandes de rendez-vous' : 'Manage appointment requests' },
    { to: '/admin/church/prayer', icon: Heart, title: fr ? 'Boîte de prière' : 'Prayer inbox', desc: fr ? 'Requêtes privées de la communauté' : 'Private community requests' },
    { to: '/admin/church/announcements', icon: Users, title: fr ? 'Annonces' : 'Announcements', desc: fr ? 'Nouvelles pour la communauté' : 'News for the community' },
    { to: '/admin/church/team', icon: Users, title: fr ? 'Équipe' : 'Team', desc: fr ? 'Inviter co-administrateurs' : 'Invite co-admins' },
    { to: '/admin/church/settings', icon: Settings, title: fr ? 'Paramètres' : 'Settings', desc: fr ? 'Marque, paiement, domaine' : 'Branding, payout, domain' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
              {church.logo_url ? <img src={church.logo_url} alt="" className="w-full h-full object-cover" /> : <Church className="h-6 w-6 text-primary" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church</p>
              <h1 className="text-xl font-bold">{church.name}</h1>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/church/${church.slug}`} target="_blank" rel="noopener">
              {fr ? 'Voir ma page' : 'View my page'} <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Payout verification banner */}
        {!payoutVerified ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                {fr ? 'Vérification de paiement à compléter' : 'Complete payout verification'}
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                {fr
                  ? 'Votre église est publique et peut déjà recevoir des dons. Complétez la vérification pour retirer les fonds.'
                  : 'Your church is public and can already receive gifts. Complete verification before you can withdraw funds.'}
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/admin/church/kyc">{fr ? 'Vérifier' : 'Verify'}</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              {fr ? 'Paiement vérifié · retraits activés' : 'Payout verified · withdrawals enabled'}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{fr ? 'Gérer mon église' : 'Manage my church'}</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {quickLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <l.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  {l.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
                      {l.badge} IA
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{l.title}</h3>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">
          {fr ? 'Certaines sections seront enrichies dans les prochaines phases.' : 'Some sections will be enriched in upcoming phases.'}
        </p>
      </div>
    </div>
  );
}
