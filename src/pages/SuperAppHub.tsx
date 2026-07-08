import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Sun, Moon, BookOpen, Wallet, ShieldCheck, Church, Home as HomeIcon, PartyPopper, GraduationCap, Search, Rocket } from 'lucide-react';
import { setIntent } from '@/lib/intent';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { useI18n } from '@/i18n/I18nContext';

/**
 * SuperAppHub — Universe 0: the front door.
 *
 * Gojek-style hub: siteviral.com opens on a short, punchy chooser
 * between our live verticals. Digital first (mature product), Beauty second (new bet).
 * No "coming soon" chips — only what's live.
 *
 * Logged-in users are routed here too when they hit "/", but they can jump
 * straight to their dashboard via the header.
 */
export default function SuperAppHub() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  useEffect(() => {
    import('@/pages/LandingPage');
    import('@/pages/beauty/BeautyLanding');
    import('@/pages/church/ChurchLanding');
    import('@/pages/home/HomeLanding');
    import('@/pages/events/EventsLanding');
    import('@/pages/education/EducationLanding');
  }, []);

  const t = (fr: string, en: string) => (isFr ? fr : en);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground overflow-x-hidden">
      <SEOHead
        title="SiteViral — L'app qui fait tourner ton Afrique"
        description="Vends tes produits digitaux. Réserve ta beauté. Un seul compte, un seul paiement, toute l'Afrique."
        canonicalUrl="https://siteviral.com"
      />

      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-border/60 bg-background/80">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
          <SiteLogo size="sm" animate />
          <span className="text-sm font-black tracking-tight">SiteViral</span>
          <div className="flex-1" />
          <GlobalPreferencesSelector />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/dashboard')}>
              {t('Mon espace', 'My space')}
            </Button>
          ) : (
            <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/auth')}>
              {t('Se connecter', 'Sign in')}
            </Button>
          )}
        </div>
      </header>

      {/* Hero + tiles — one screen on desktop, scrollable on mobile */}
      <main id="main-content" role="main" className="flex-1 flex flex-col">
        <section className="relative flex-1 flex items-center">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl" />
          </div>

          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                {t('Une app. Toute l\'Afrique.', 'One app. All of Africa.')}
              </div>
              <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
                {t('Choisis ton ', 'Pick your ')}
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  SiteViral.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                {t(
                  'Un seul compte. Un seul paiement Mobile Money. Trois univers pour faire tourner ton business, ta beauté et ta foi.',
                  'One account. One Mobile Money payment. Three universes to power your business, your beauty and your faith.',
                )}
              </p>
            </div>

            {/* Intent-first — two paths */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setIntent('client');
                  navigate('/looking-for');
                }}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Search className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-black">{t('Je cherche quelque chose', "I'm looking for something")}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t('Beauté, tuteur, artisan, église, produits, événements…', 'Beauty, tutor, artisan, church, products, events…')}
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-primary transition group-hover:translate-x-1" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setIntent('provider'); navigate('/start'); }}
                className="group relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Rocket className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-black">{t('Je veux proposer ou vendre', 'I want to offer or sell')}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t('Services, RDV, produits, dons, événements, IA…', 'Services, appointments, products, donations, events, AI…')}
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-primary transition group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            {/* The two tiles */}
            <div id="sv-verticals" className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {/* Digital tile — primary vertical */}
              <Link
                to="/digital"
                onClick={() => { try { localStorage.setItem('sv_last_vertical', 'digital'); } catch {} }}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
                aria-label={t('Ouvrir SiteViral Digital', 'Open SiteViral Digital')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent opacity-80 transition group-hover:opacity-100" />
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl transition group-hover:bg-primary/35" />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                      <BookOpen className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {t('Créateurs', 'Creators')}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    SiteViral
                  </div>
                  <div className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Digital</div>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    {t(
                      'Écris ton livre avec l\'IA. Vends tes formations. Fais tourner tes ambassadeurs. Paie en Mobile Money.',
                      'Write your book with AI. Sell your courses. Grow via ambassadors. Get paid in Mobile Money.',
                    )}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                    {t('Entrer', 'Enter')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* Beauty tile — new vertical */}
              <Link
                to="/beauty"
                onClick={() => { try { localStorage.setItem('sv_last_vertical', 'beauty'); } catch {} }}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
                aria-label={t('Ouvrir SiteViral Beauty', 'Open SiteViral Beauty')}
              >
                <div
                  className="absolute inset-0 opacity-80 transition group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(340 82% 60% / 0.18), hsl(28 88% 60% / 0.10) 60%, transparent)',
                  }}
                />
                <div
                  className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl transition"
                  style={{ background: 'hsl(340 82% 60% / 0.3)' }}
                />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, hsl(340 82% 60%), hsl(28 88% 60%))' }}
                    >
                      <Sparkles className="h-6 w-6" />
                    </span>
                    <span
                      className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'hsl(340 82% 45%)' }}
                    >
                      {t('Nouveau', 'New')}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    SiteViral
                  </div>
                  <div
                    className="mt-1 text-3xl font-black tracking-tight sm:text-4xl"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, hsl(340 82% 55%), hsl(28 88% 55%))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Beauty
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    {t(
                      'Coiffure, ongles, maquillage, spa. Réserve les meilleures pros beauté près de toi. Paiement sécurisé, avis vérifiés.',
                      'Hair, nails, makeup, spa. Book the best beauty pros near you. Secure payment, verified reviews.',
                    )}
                  </p>
                  <div
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold"
                    style={{ color: 'hsl(340 82% 50%)' }}
                  >
                    {t('Entrer', 'Enter')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* Church tile — faith vertical */}
              <Link
                to="/church"
                onClick={() => { try { localStorage.setItem('sv_last_vertical', 'church'); } catch {} }}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
                aria-label={t('Ouvrir SiteViral Church', 'Open SiteViral Church')}
              >
                <div
                  className="absolute inset-0 opacity-80 transition group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(258 60% 55% / 0.20), hsl(45 90% 55% / 0.10) 60%, transparent)',
                  }}
                />
                <div
                  className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl transition"
                  style={{ background: 'hsl(258 60% 55% / 0.3)' }}
                />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, hsl(258 60% 55%), hsl(45 90% 55%))' }}
                    >
                      <Church className="h-6 w-6" />
                    </span>
                    <span
                      className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'hsl(258 60% 45%)' }}
                    >
                      {t('Églises', 'Churches')}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    SiteViral
                  </div>
                  <div
                    className="mt-1 text-3xl font-black tracking-tight sm:text-4xl"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, hsl(258 60% 55%), hsl(45 90% 55%))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Church
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    {t(
                      'Prédications audio, transformation IA en livres et articles, dîmes en Mobile Money & carte, communauté et prière.',
                      'Audio sermons, AI transformation into books and articles, tithes via Mobile Money & card, community and prayer.',
                    )}
                  </p>
                  <div
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold"
                    style={{ color: 'hsl(258 60% 50%)' }}
                  >
                    {t('Entrer', 'Enter')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* Home Services tile — new vertical */}
              <Link
                to="/home"
                onClick={() => { try { localStorage.setItem('sv_last_vertical', 'home'); } catch {} }}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
                aria-label={t('Ouvrir SiteViral Home', 'Open SiteViral Home')}
              >
                <div
                  className="absolute inset-0 opacity-80 transition group-hover:opacity-100"
                  style={{ background: 'linear-gradient(135deg, hsl(200 88% 55% / 0.20), hsl(160 70% 50% / 0.10) 60%, transparent)' }}
                />
                <div
                  className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl transition"
                  style={{ background: 'hsl(200 88% 55% / 0.3)' }}
                />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, hsl(200 88% 55%), hsl(160 70% 50%))' }}
                    >
                      <HomeIcon className="h-6 w-6" />
                    </span>
                    <span
                      className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'hsl(200 88% 40%)' }}
                    >
                      {t('Nouveau', 'New')}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">SiteViral</div>
                  <div
                    className="mt-1 text-3xl font-black tracking-tight sm:text-4xl"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, hsl(200 88% 50%), hsl(160 70% 45%))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Home
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    {t(
                      'Plombier, électricien, ménage, déménagement. Les meilleurs pros vérifiés près de toi, paiement bloqué en sécurité.',
                      'Plumber, electrician, cleaner, movers. The best verified pros near you, payment held safe.',
                    )}
                  </p>
                  <div
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold"
                    style={{ color: 'hsl(200 88% 45%)' }}
                  >
                    {t('Entrer', 'Enter')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* Events tile — new vertical */}
              <Link
                to="/events"
                onClick={() => { try { localStorage.setItem('sv_last_vertical', 'events'); } catch {} }}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
                aria-label={t('Ouvrir SiteViral Events', 'Open SiteViral Events')}
              >
                <div
                  className="absolute inset-0 opacity-80 transition group-hover:opacity-100"
                  style={{ background: 'linear-gradient(135deg, hsl(300 80% 55% / 0.22), hsl(270 75% 55% / 0.10) 60%, transparent)' }}
                />
                <div
                  className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl transition"
                  style={{ background: 'hsl(300 80% 55% / 0.3)' }}
                />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, hsl(300 80% 55%), hsl(270 75% 55%))' }}
                    >
                      <PartyPopper className="h-6 w-6" />
                    </span>
                    <span
                      className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'hsl(300 80% 40%)' }}
                    >
                      {t('Nouveau', 'New')}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">SiteViral</div>
                  <div
                    className="mt-1 text-3xl font-black tracking-tight sm:text-4xl"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, hsl(300 80% 50%), hsl(270 75% 50%))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Events
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    {t(
                      'Photographe, DJ, traiteur, décoration, salle. Les meilleurs prestataires pour ton mariage ou soirée, acompte bloqué en sécurité.',
                      'Photographer, DJ, caterer, decorator, venue. The best vendors for your wedding or party, deposit held safe.',
                    )}
                  </p>
                  <div
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold"
                    style={{ color: 'hsl(300 80% 45%)' }}
                  >
                    {t('Entrer', 'Enter')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* Learn tile — new vertical */}
              <Link
                to="/learn"
                onClick={() => { try { localStorage.setItem('sv_last_vertical', 'learn'); } catch {} }}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl sm:p-8"
                aria-label={t('Ouvrir SiteViral Learn', 'Open SiteViral Learn')}
              >
                <div
                  className="absolute inset-0 opacity-80 transition group-hover:opacity-100"
                  style={{ background: 'linear-gradient(135deg, hsl(174 72% 45% / 0.22), hsl(188 78% 46% / 0.10) 60%, transparent)' }}
                />
                <div
                  className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl transition"
                  style={{ background: 'hsl(174 72% 45% / 0.3)' }}
                />
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, hsl(174 72% 45%), hsl(188 78% 46%))' }}
                    >
                      <GraduationCap className="h-6 w-6" />
                    </span>
                    <span
                      className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'hsl(174 72% 35%)' }}
                    >
                      {t('Nouveau', 'New')}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">SiteViral</div>
                  <div
                    className="mt-1 text-3xl font-black tracking-tight sm:text-4xl"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, hsl(174 72% 40%), hsl(188 78% 42%))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Learn
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    {t(
                      'Cours particuliers de maths, langues, code, musique. En ligne ou à domicile, paiement bloqué en escrow.',
                      'Private lessons in math, languages, coding, music. Online or in-person, payment held in escrow.',
                    )}
                  </p>
                  <div
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold"
                    style={{ color: 'hsl(174 72% 40%)' }}
                  >
                    {t('Entrer', 'Enter')} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>



            {/* Trust strip */}
            <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:mt-12">
              {[
                { icon: Wallet, label: t('Mobile Money', 'Mobile Money'), sub: t('Wave, Orange, MTN, Moov', 'Wave, Orange, MTN, Moov') },
                { icon: ShieldCheck, label: t('Paiement sécurisé', 'Secure payment'), sub: t('Fonds bloqués', 'Funds held safe') },
                { icon: Sparkles, label: t('Un seul compte', 'One account'), sub: t('Digital + Beauty + Learn + Church', 'Digital + Beauty + Learn + Church') },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/60 bg-background/50 p-3 sm:p-4"
                >
                  <Icon className="mx-auto h-4 w-4 text-primary sm:h-5 sm:w-5" />
                  <div className="mt-1.5 text-xs font-bold sm:text-sm">{label}</div>
                  <div className="text-[10px] text-muted-foreground sm:text-xs">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SiteViral
        <span className="mx-2">·</span>
        <Link to="/digital/about" className="hover:text-foreground">{t('À propos', 'About')}</Link>
        <span className="mx-2">·</span>
        <Link to="/contact" className="hover:text-foreground">Contact</Link>
        <span className="mx-2">·</span>
        <Link to="/pricing" className="hover:text-foreground">{t('Tarifs', 'Pricing')}</Link>
      </footer>
    </div>
  );
}
