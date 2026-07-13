import { Link } from 'react-router-dom';
import {
  Church, Users, HandCoins, Radio, CalendarDays, MessageCircle, Bell, Wallet,
  Globe, ShieldCheck, Settings2, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { setPendingAction } from '@/lib/pendingAction';
import { useNavigate } from 'react-router-dom';

/**
 * Public canonical page: /churches
 * Explains only real, currently shipping Church capabilities.
 */
export default function ChurchesPage() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const navigate = useNavigate();

  const t = (a: string, b: string) => (fr ? a : b);

  const capabilities = [
    { icon: Users, title: t('Gestion des membres', 'Member management'), text: t('Annuaire, rôles, groupes et suivi de la vie de l\'église.', 'Directory, roles, groups and lifecycle tracking.') },
    { icon: HandCoins, title: t('Dons & offrandes', 'Giving & donations'), text: t('Recevez des dons ponctuels ou récurrents, avec reçus.', 'Accept one-off or recurring gifts, with receipts.') },
    { icon: Radio, title: t('Sermons & contenus', 'Sermons & content'), text: t('Publiez sermons audio, PDF et ressources pour les fidèles.', 'Publish audio sermons, PDFs and resources for members.') },
    { icon: CalendarDays, title: t('Événements', 'Events'), text: t('Créez, promouvez et enregistrez les inscriptions.', 'Create, promote and manage registrations.') },
    { icon: MessageCircle, title: t('Rendez-vous', 'Appointments'), text: t('Prise de rendez-vous pastorale ou administrative.', 'Pastoral or administrative appointment booking.') },
    { icon: Bell, title: t('Communication', 'Communication'), text: t('Annonces, notifications et demandes de prière.', 'Announcements, notifications and prayer requests.') },
    { icon: Wallet, title: t('Gestion des paiements', 'Payment management'), text: t('Suivi des transactions, historique et exports.', 'Transaction tracking, history and exports.') },
    { icon: Globe, title: t('Page publique', 'Public church page'), text: t('Une adresse publique pour être trouvé et rejoint.', 'A public address so people can find and join you.') },
    { icon: ShieldCheck, title: t('Rôles & sécurité', 'Roles & security'), text: t('Contrôlez qui accède à quoi dans votre église.', 'Control who can access what in your church.') },
  ];

  const startChurch = () => {
    setIntent('provider', '/church/pro/onboarding');
    setPendingAction('create_organization', '/church/pro/onboarding', { kind: 'church' });
    navigate('/church/pro/onboarding');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title={fr ? 'SiteViral pour les églises — Un espace complet pour votre église' : 'SiteViral for churches — One complete space for your church'}
        description={fr
          ? 'Gérez membres, dons, sermons, événements, rendez-vous, communication et paiements depuis un seul espace église.'
          : 'Manage members, giving, sermons, events, appointments, communication and payments from one church space.'}
        canonicalUrl="https://siteviral.com/churches"
      />
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
        <div className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 20%, hsl(var(--accent)/0.28), transparent 55%), radial-gradient(circle at 90% 80%, hsl(var(--primary)/0.35), transparent 60%)',
          }}
        />
        <div className="relative container max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider mb-6">
              <Church className="h-3.5 w-3.5 text-accent" />
              {fr ? 'SiteViral pour les églises' : 'SiteViral for churches'}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
              {fr ? (
                <>Votre église, <span className="text-accent">un seul espace.</span></>
              ) : (
                <>Your church, <span className="text-accent">one space.</span></>
              )}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-sidebar-foreground/75 max-w-2xl leading-relaxed">
              {fr
                ? 'Membres, dons, sermons, événements, rendez-vous, communication et paiements — tout au même endroit, sans installations compliquées.'
                : 'Members, giving, sermons, events, appointments, communication and payments — all in one place, with no complex setup.'}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={startChurch} className="h-12 px-6 rounded-xl font-semibold gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                {fr ? 'Créer votre espace église' : 'Create your church space'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="outline" className="h-12 px-6 rounded-xl font-semibold border-white/25 bg-white/5 text-sidebar-foreground hover:bg-white/10">
                <Link to="/auth?mode=signin">{fr ? 'Se connecter pour gérer' : 'Sign in to manage'}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-2">
            {fr ? 'Ce que vous obtenez' : 'What you get'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Tout ce qu\'il faut pour gérer votre église, aujourd\'hui.' : 'Everything you need to run your church, today.'}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map(c => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="font-bold text-[15px]">{c.title}</div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Admin & security */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-4">
                <Settings2 className="h-3 w-3" />
                {fr ? 'Administration' : 'Administration'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {fr
                  ? 'Confiez les bons droits aux bonnes personnes.'
                  : 'Give the right permissions to the right people.'}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                {fr
                  ? 'Rôles administratifs pour votre pasteur, votre équipe et vos bénévoles. Chaque personne voit uniquement ce dont elle a besoin.'
                  : 'Administrative roles for your pastor, team and volunteers. Each person sees only what they need.'}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Users, label: fr ? 'Équipe multi-rôles' : 'Multi-role team' },
                { icon: ShieldCheck, label: fr ? 'Accès sécurisé' : 'Secure access' },
                { icon: Wallet, label: fr ? 'Historique des dons' : 'Giving history' },
                { icon: Bell, label: fr ? 'Notifications' : 'Notifications' },
              ].map(x => (
                <div key={x.label} className="rounded-2xl border border-border bg-background p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <x.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">{x.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-4xl px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          {fr ? 'Prêt à démarrer ?' : 'Ready to get started?'}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          {fr
            ? 'Créez votre espace église en quelques minutes et invitez votre équipe.'
            : 'Create your church space in minutes and invite your team.'}
        </p>
        <div className="mt-7 flex flex-wrap gap-3 justify-center">
          <Button onClick={startChurch} className="h-12 px-6 rounded-xl font-semibold gap-1.5">
            {fr ? 'Créer votre espace église' : 'Create your church space'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline" className="h-12 px-6 rounded-xl font-semibold">
            <Link to="/auth?mode=signin">{fr ? 'Se connecter pour gérer votre église' : 'Sign in to manage your church'}</Link>
          </Button>
        </div>
      </section>

      <LandingFooterCompact />
    </div>
  );
}
