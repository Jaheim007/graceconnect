import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Wallet, Users, Zap, Star, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooterCompact } from '@/components/landing/LandingFooterCompact';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { setIntent } from '@/lib/intent';

/**
 * Dedicated seller pitch page — mirrors fiverr.com/start_selling.
 * Sells the provider value prop, then CTA takes them to /start (goal picker).
 */
export default function StartSellingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const go = () => {
    setIntent('provider', '/start');
    if (user) navigate('/start');
    else navigate('/auth?mode=signup&returnTo=/start');
  };

  const benefits = [
    { icon: Users,       fr: { t: 'Des clients qualifiés',    d: 'Une marketplace panafricaine active, du trafic ciblé.' },
                          en: { t: 'Qualified clients',         d: 'An active pan-African marketplace with targeted traffic.' } },
    { icon: Wallet,      fr: { t: 'Paiements Mobile Money',   d: 'Sois payé en Orange Money, MTN, Wave, carte ou virement.' },
                          en: { t: 'Mobile Money payouts',      d: 'Get paid via Orange, MTN, Wave, card or bank transfer.' } },
    { icon: ShieldCheck, fr: { t: 'Protection anti-arnaque',  d: 'Paiement bloqué côté client, libéré à la livraison.' },
                          en: { t: 'Anti-scam protection',      d: 'Client payments held safe, released on delivery.' } },
    { icon: Zap,         fr: { t: 'Outils tout-en-un',        d: 'Boutique, agenda, messagerie, factures, analytics.' },
                          en: { t: 'All-in-one tools',          d: 'Storefront, calendar, inbox, invoices, analytics.' } },
  ];

  const steps = [
    { n: 1, fr: 'Crée ton compte gratuitement en 2 minutes.',                           en: 'Create your free account in 2 minutes.' },
    { n: 2, fr: 'Choisis ton activité — on te prépare les bons outils.',                en: 'Pick your activity — we set up the right tools.' },
    { n: 3, fr: 'Publie tes offres, réponds aux clients, sois payé.',                    en: 'Publish your offers, reply to clients, get paid.' },
  ];

  const categories = [
    { fr: 'Beauté', en: 'Beauty' }, { fr: 'Tutorat', en: 'Tutoring' }, { fr: 'Artisans', en: 'Artisans' },
    { fr: 'Événements', en: 'Events' }, { fr: 'Ebooks', en: 'Ebooks' }, { fr: 'Musique', en: 'Music' },
    { fr: 'Influence', en: 'Influencers' }, { fr: 'Coaching', en: 'Coaching' }, { fr: 'Design', en: 'Design' },
    { fr: 'Développement', en: 'Development' }, { fr: 'Photo', en: 'Photography' }, { fr: 'Traduction', en: 'Translation' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title={fr ? 'Proposer mes services sur SiteViral' : 'Offer my services on SiteViral'}
        description={fr
          ? 'Lancez votre activité en 5 minutes. Outils pros, paiements Mobile Money, clients qualifiés en Afrique et au-delà.'
          : 'Launch your business in 5 minutes. Pro tools, Mobile Money payouts, qualified clients across Africa and beyond.'}
        canonicalUrl="https://siteviral.com/start-selling"
      />
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground pt-14">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--accent)/0.4), transparent 55%), radial-gradient(circle at 80% 70%, hsl(var(--primary)/0.5), transparent 55%)' }}
        />
        <div className="relative container max-w-6xl px-4 py-20 sm:py-28 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider mb-6">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              {fr ? 'Rejoins +12 000 pros' : 'Join +12,000 pros'}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black leading-[1.02] tracking-tight">
              {fr ? (<>Transforme ton talent en <span className="text-accent">revenus</span>.</>)
                  : (<>Turn your talent into <span className="text-accent">income</span>.</>)}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-sidebar-foreground/75 leading-relaxed max-w-xl">
              {fr
                ? 'SiteViral te connecte à des clients partout en Afrique. Crée ta boutique, gère tout depuis un seul endroit, sois payé en Mobile Money.'
                : 'SiteViral connects you with clients across Africa. Build your storefront, run everything from one place, get paid in Mobile Money.'}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={go} className="h-13 px-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-bold shadow-xl">
                {fr ? 'Commencer gratuitement' : 'Start for free'} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="h-13 px-8 bg-white/5 border-white/25 text-white hover:bg-white/10 hover:text-white">
                {fr ? 'Voir les tarifs' : 'See pricing'}
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sidebar-foreground/70">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> {fr ? 'Sans frais d’inscription' : 'No signup fees'}</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> {fr ? 'Annule à tout moment' : 'Cancel anytime'}</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> {fr ? 'Support 7j/7' : '7-day support'}</div>
            </div>
          </div>

          {/* Hero visual card */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 bg-gradient-to-br from-accent/30 to-primary/20 blur-3xl rounded-3xl" />
            <div className="relative rounded-3xl bg-white/95 text-foreground p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                  <div>
                    <div className="text-sm font-bold">Aïcha K.</div>
                    <div className="text-[11px] text-muted-foreground">{fr ? 'Coiffeuse pro · Abidjan' : 'Pro hairstylist · Abidjan'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" /> 4.9
                </div>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {fr ? 'Revenus ce mois' : 'This month'}
                </div>
                <div className="text-3xl font-black mt-1">485 000 F</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">↑ +32% {fr ? 'vs mois dernier' : 'vs last month'}</div>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { fr: 'Coloration + brushing', en: 'Color + blowout', p: '25 000 F' },
                  { fr: 'Tresses collées', en: 'Cornrows', p: '15 000 F' },
                  { fr: 'Soin capillaire', en: 'Hair treatment', p: '8 000 F' },
                ].map((s) => (
                  <div key={s.en} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40">
                    <span className="font-medium">{fr ? s.fr : s.en}</span>
                    <span className="font-bold text-primary">{s.p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container max-w-6xl px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
            {fr ? 'Pourquoi SiteViral' : 'Why SiteViral'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {fr ? 'Tout ce qu’il faut pour réussir.' : 'Everything you need to succeed.'}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => {
            const l = fr ? b.fr : b.en;
            return (
              <div key={l.t} className="rounded-2xl border bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4 ring-1 ring-primary/20">
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="font-bold text-lg">{l.t}</div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{l.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-muted/40 border-y">
        <div className="container max-w-4xl px-4 py-20">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-12">
            {fr ? 'Commence en 3 étapes' : 'Get started in 3 steps'}
          </h2>
          <ol className="space-y-4">
            {steps.map((s) => (
              <li key={s.n} className="flex items-start gap-5 rounded-2xl bg-card border p-6">
                <div className="h-12 w-12 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center font-black text-lg">
                  {s.n}
                </div>
                <p className="text-base sm:text-lg font-semibold pt-2">{fr ? s.fr : s.en}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Button size="lg" onClick={go} className="h-13 px-10 gap-2 font-bold shadow-lg">
              {fr ? 'Créer mon compte pro' : 'Create my pro account'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container max-w-6xl px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-3">
          {fr ? 'Que vends-tu ?' : 'What do you sell?'}
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          {fr ? 'Choisis parmi des dizaines de catégories.' : 'Pick from dozens of categories.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {categories.map((c) => (
            <button
              key={c.en}
              onClick={go}
              className="px-4 py-2 rounded-full border bg-card hover:border-primary hover:bg-primary/5 text-sm font-semibold transition"
            >
              {fr ? c.fr : c.en}
            </button>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-10 sm:p-14 text-center">
            <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black text-primary-foreground tracking-tight">
                {fr ? 'Ta prochaine vente commence ici.' : 'Your next sale starts here.'}
              </h2>
              <p className="mt-3 text-primary-foreground/85 max-w-lg mx-auto">
                {fr ? 'Rejoins la marketplace qui met les pros africains en avant.' : 'Join the marketplace that champions African pros.'}
              </p>
              <Button size="lg" onClick={go} className="mt-6 h-13 px-10 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                {fr ? 'Commencer maintenant' : 'Get started now'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooterCompact />
    </div>
  );
}
