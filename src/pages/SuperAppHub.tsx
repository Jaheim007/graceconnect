import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Sun, Moon, BookOpen, Wallet, ShieldCheck } from 'lucide-react';
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
    // Preload the two vertical entries so the tile tap feels instant
    import('@/pages/LandingPage');
    import('@/pages/beauty/BeautyLanding');
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
      <header className="sticky top-0 z-40 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
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
                  'Un seul compte. Un seul paiement Mobile Money. Deux univers pour faire tourner ton business et ta beauté.',
                  'One account. One Mobile Money payment. Two universes to power your business and your beauty.',
                )}
              </p>
            </div>

            {/* The two tiles */}
            <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2">
              {/* Digital tile — primary vertical */}
              <Link
                to="/digital"
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
                    <span className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur">
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
                      className="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur"
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
            </div>

            {/* Trust strip */}
            <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:mt-12">
              {[
                { icon: Wallet, label: t('Mobile Money', 'Mobile Money'), sub: t('Wave, Orange, MTN, Moov', 'Wave, Orange, MTN, Moov') },
                { icon: ShieldCheck, label: t('Paiement sécurisé', 'Secure payment'), sub: t('Fonds bloqués', 'Funds held safe') },
                { icon: Sparkles, label: t('Un seul compte', 'One account'), sub: t('Digital + Beauty', 'Digital + Beauty') },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/60 bg-background/50 p-3 backdrop-blur sm:p-4"
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
