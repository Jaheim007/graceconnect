import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Church, Mic, HandHeart, Calendar, Heart, Users, Settings, ShieldCheck, ShieldAlert,
  ExternalLink, Loader2, Sparkles, ArrowUpRight,
} from 'lucide-react';
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
        .select('id, slug, name, status, verified, logo_url, cover_url, kyc_submission_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!church) return { church: null, counts: { sermons: 0, campaigns: 0, events: 0, prayers: 0 } };

      const [sermons, campaigns, events, prayers] = await Promise.all([
        supabase.from('church_sermons').select('id', { count: 'exact', head: true }).eq('church_id', church.id),
        supabase.from('church_campaigns').select('id', { count: 'exact', head: true }).eq('church_id', church.id),
        supabase.from('church_events').select('id', { count: 'exact', head: true }).eq('church_id', church.id),
        supabase.from('church_prayer_requests').select('id', { count: 'exact', head: true }).eq('church_id', church.id).eq('status', 'new'),
      ]);
      return {
        church,
        counts: {
          sermons: sermons.count ?? 0,
          campaigns: campaigns.count ?? 0,
          events: events.count ?? 0,
          prayers: prayers.count ?? 0,
        },
      };
    },
  });

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth?returnTo=/church/pro" replace />;
  if (!data?.church) return <Navigate to="/church/pro/onboarding" replace />;

  const { church, counts } = data;
  const isVerified = church.status === 'active' && church.verified;

  const stats = [
    { label: fr ? 'Prédications' : 'Sermons', value: counts.sermons, icon: Mic },
    { label: fr ? 'Campagnes' : 'Campaigns', value: counts.campaigns, icon: HandHeart },
    { label: fr ? 'Événements' : 'Events', value: counts.events, icon: Calendar },
    { label: fr ? 'Prières nouvelles' : 'New prayers', value: counts.prayers, icon: Heart },
  ];

  const quickLinks = [
    { to: '/church/pro/sermons', icon: Mic, title: fr ? 'Prédications & IA' : 'Sermons & AI', desc: fr ? 'Uploader, transcrire, transformer en ebook/blog' : 'Upload, transcribe, transform to ebook/blog', badge: <Sparkles className="h-3 w-3" /> },
    { to: '/church/pro/giving', icon: HandHeart, title: fr ? 'Dîmes & offrandes' : 'Tithes & offerings', desc: fr ? 'Dons, récurrents, campagnes, reçus' : 'Donations, recurring, campaigns, receipts' },
    { to: '/church/pro/events', icon: Calendar, title: fr ? 'Événements & culte' : 'Events & services', desc: fr ? 'Programme, live streaming' : 'Schedule, live streaming' },
    { to: '/church/pro/prayer', icon: Heart, title: fr ? 'Boîte de prière' : 'Prayer inbox', desc: fr ? 'Requêtes privées de la communauté' : 'Private community requests' },
    { to: '/church/pro/members', icon: Users, title: fr ? 'Membres & diaspora' : 'Members & diaspora', desc: fr ? 'Segmentez vos fidèles' : 'Segment your members' },
    { to: '/church/pro/settings', icon: Settings, title: fr ? 'Paramètres' : 'Settings', desc: fr ? 'Marque, paiement, domaine' : 'Branding, payout, domain' },
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

        {/* KYC banner */}
        {!isVerified ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                {fr ? 'Vérification KYC requise' : 'KYC verification required'}
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                {fr
                  ? 'Votre église n\'apparaît pas encore dans la découverte et ne peut pas recevoir de dons.'
                  : 'Your church isn\'t discoverable yet and can\'t receive donations.'}
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/church/pro/kyc">{fr ? 'Vérifier' : 'Verify'}</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              {fr ? 'Église vérifiée · visible dans la découverte' : 'Verified church · visible in discovery'}
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
