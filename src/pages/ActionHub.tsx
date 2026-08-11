import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, Store, Compass, HandCoins, Wallet, Church } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getActionNavItems } from '@/lib/navigation/actionNavItems';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
};

export default function ActionHub() {
  const navigate = useNavigate();
  const { user, isSuperadmin } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const { locale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { hasPurchases, hasOrgs } = useUserProfile();
  const isFr = locale === 'fr';
  const hasManageableOrg = userOrgs.some(o => canManage(o.id));
  const [prompt, setPrompt] = useState<'revenue' | 'purchases' | null>(null);


  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name;

  const resolveRoute = (id: string) => {
    switch (id) {
      case 'course': return hasManageableOrg ? '/admin/programs' : user ? '/create-org' : '/creer-formation';
      case 'sell': return hasManageableOrg ? '/admin/products' : user ? '/create-org' : '/vendre';
      case 'orgs': return hasManageableOrg ? '/admin' : '/create-org';
      default: return '';
    }
  };

  /** Visitor menu — Discover first, then the core creation actions. */
  const visitorActions = [
    { id: 'discover', icon: Compass, titleFr: 'Découvrir', titleEn: 'Discover',
      descFr: 'Voir et acheter des livres, formations et plus', descEn: 'Browse & buy books, courses & more',
      route: '/discover', borderClass: 'border-violet-500/30 hover:border-violet-500/60',
      iconBg: 'bg-violet-500/15', iconColor: 'text-violet-500' },
    { id: 'sell', icon: Store, titleFr: 'Vendre', titleEn: 'Sell',
      descFr: 'Vends tes livres, formations et plus', descEn: 'Sell your books, courses & more',
      route: '/vendre', borderClass: 'border-amber-500/30 hover:border-amber-500/60',
      iconBg: 'bg-amber-500/15', iconColor: 'text-amber-500' },
    { id: 'earn', icon: HandCoins, titleFr: 'Gagner', titleEn: 'Earn',
      descFr: 'Partage et touche des commissions', descEn: 'Share products and earn commissions',
      route: '/gagner', borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-500' },
    { id: 'faith', icon: Church, titleFr: 'Créer un espace Église / ONG', titleEn: 'Create a Church / NGO space',
      descFr: 'Offrandes, dons, enseignements et ressources', descEn: 'Offerings, donations, teachings & resources',
      route: '/create-org?scope=faith', borderClass: 'border-sky-500/30 hover:border-sky-500/60',
      iconBg: 'bg-sky-500/15', iconColor: 'text-sky-500' },
    { id: 'write', icon: BookOpen, titleFr: 'Écrire un livre en 5 min', titleEn: 'Write a book in 5 min',
      descFr: "Crée ton livre avec l'IA et vends-le", descEn: 'Create your book with AI and sell it',
      route: '/ecrire', borderClass: 'border-primary/30 hover:border-primary/60',
      iconBg: 'bg-primary/15', iconColor: 'text-primary' },
    { id: 'course', icon: GraduationCap, titleFr: 'Créer une formation', titleEn: 'Create a formation',
      descFr: 'Modules, leçons, quiz et certificats', descEn: 'Modules, lessons, quizzes and certificates',
      route: '/creer-formation', borderClass: 'border-indigo-500/30 hover:border-indigo-500/60',
      iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-500' },
  ];

  const baseAuthed = getActionNavItems({
    isAuthenticated: !!user,
    hasPurchases,
    hasManageableOrg,
    hasOrgs,
    isSuperadmin,
  }, resolveRoute);

  /** Signed-in users always see the full menu — empty states are handled by prompts. */
  const authedActions = (() => {
    const items = [...baseAuthed];
    const has = (id: string) => items.some(i => i.id === id);
    if (!has('sell')) {
      items.push({
        id: 'sell', icon: Store, emoji: '🛒',
        titleFr: 'Vendre', titleEn: 'Sell',
        descFr: 'Vends tes livres, formations et plus', descEn: 'Sell your books, courses & more',
        route: resolveRoute('sell'),
        borderClass: 'border-amber-500/30 hover:border-amber-500/60',
        iconBg: 'bg-amber-500/15', iconColor: 'text-amber-500',
      });
    }
    if (!has('sales')) {
      items.push({
        id: 'sales', icon: Wallet, emoji: '💵',
        titleFr: 'Revenus', titleEn: 'Revenue',
        descFr: 'Ventes, dons reçus, commissions et retraits', descEn: 'Sales, donations, commissions & payouts',
        route: hasManageableOrg ? '/admin/sales' : '/create-org',
        borderClass: 'border-teal-500/30 hover:border-teal-500/60',
        iconBg: 'bg-teal-500/15', iconColor: 'text-teal-500',
      });
    }
    // Ordering: my dashboard → discover → purchases → sell → revenue → earn → create.
    const order = ['overview', 'discover', 'purchases', 'sell', 'sales', 'claim', 'write', 'course', 'superadmin'];
    const rank = (id: string) => {
      const i = order.indexOf(id);
      return i === -1 ? order.length : i;
    };
    return items.sort((a, b) => rank(a.id) - rank(b.id));
  })();


  const actions = user ? authedActions : visitorActions;


  const handleAction = (action: { id: string; route: string }) => {
    if (action.id === 'sales' && !hasManageableOrg) {
      setPrompt('revenue');
      return;
    }
    if (action.id === 'purchases' && !hasPurchases) {
      setPrompt('purchases');
      return;
    }
    navigate(action.route);
  };


  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[hsl(var(--cert-paper))] dark:bg-[#08070f] overflow-hidden">
      {/* Certificate-grade backdrop: warm paper in light, deep ink in dark — gold aurora both ways */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-1/3 -left-1/4 h-[70vh] w-[70vh] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--brand-blue)/0.16), transparent 65%)' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/3 -right-1/4 h-[65vh] w-[65vh] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.14), transparent 65%)' }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Engraved grid */}
        <div
          className="absolute inset-0 opacity-[0.07] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--brand-blue)/0.55) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--brand-blue)/0.55) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 72%)',
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--brand-blue)/0.55), transparent)' }}
        />
      </div>

      <SEOHead

        title="SiteViral — Écris. Vends. Gagne."
        description="Écris ton livre en 5 minutes avec l'IA. Vends-le. Fais-le distribuer par des ambassadeurs. Mobile Money inclus. Gratuit."
        canonicalUrl="https://siteviral.com"
        keywords="écrire un livre IA, vendre ebook Afrique, gagner argent en partageant, programme ambassadeur, Mobile Money"
        jsonLd={[{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'SiteViral',
          url: 'https://siteviral.com',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: "Écris ton livre en 5 minutes avec l'IA. Vends-le. Fais-le distribuer par des ambassadeurs.",
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'XOF',
            description: 'Gratuit. Commission de 10% sur les ventes uniquement.',
          },
        }]}
      />

      {/* Compact mobile-first top bar */}
      <header className="relative h-12 sm:h-14 sticky top-0 z-40 backdrop-blur-xl bg-[hsl(var(--cert-paper))]/70 dark:bg-[#08070f]/70 border-b border-[hsl(var(--brand-blue))]/20 flex items-center px-3 sm:px-4 gap-2 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-[hsl(var(--brand-blue))]/60 after:to-transparent">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-14 left-8 h-28 w-40 rounded-full bg-[hsl(var(--brand-blue))]/20 blur-3xl" />
        </div>
        <div className="relative flex items-center">
          <SiteLogo size="sm" animate />
        </div>
        <div className="flex-1" />
        <div className="relative flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-[hsl(var(--brand-blue))]/10 hover:text-foreground sm:inline-flex"
            onClick={() => navigate('/landing')}
          >
            {isFr ? 'Découvrir SiteViral' : 'About SiteViral'}
          </Button>
          <GlobalPreferencesSelector />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-transform hover:scale-110 hover:bg-[hsl(var(--brand-blue))]/10"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <Button
              size="sm"
              className="h-8 rounded-full px-4 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0"
              onClick={() => navigate('/dashboard')}
            >
              {isFr ? 'Tableau de bord' : 'Dashboard'}
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 rounded-full px-4 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0"
              onClick={() => navigate('/auth')}
            >
              {isFr ? 'Connexion' : 'Sign in'}
            </Button>
          )}
        </div>
      </header>

      {/* Main content — centered vertically, mobile-optimized spacing */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 lg:pb-8">

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-2xl space-y-6"
        >
          {/* Hero */}
          <motion.div variants={item} className="text-center space-y-3">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.32em] text-[hsl(var(--brand-blue))] dark:text-primary">
              {isFr ? 'Gratuit pour commencer' : 'Free to start'}
            </p>
            <h1 className="font-heading text-[28px] sm:text-[42px] font-bold tracking-tight text-foreground leading-[1.06]">
              {user && displayName
                ? (isFr ? `Salut ${displayName}.` : `Hey ${displayName}.`)
                : (isFr ? 'Que veux-tu ' : 'What do you ')}
              <span
                className="italic"
                style={{
                  backgroundImage: 'linear-gradient(120deg, hsl(var(--brand-blue)), hsl(var(--brand-blue-soft)), hsl(var(--brand-blue)))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {user && displayName
                  ? (isFr ? ' On continue' : ' Let’s continue')
                  : (isFr ? 'faire' : 'want to do')}
              </span>
              <span className="not-italic text-foreground/70">{user && displayName ? (isFr ? ' ?' : '.') : (isFr ? ' ?' : '?')}</span>
            </h1>

            <div
              aria-hidden
              className="mx-auto h-px w-24"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--brand-blue)/0.8), transparent)' }}
            />
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px] mx-auto">
              {user
                ? (isFr ? 'Choisis une action pour continuer.' : 'Pick an action to continue.')
                : (isFr ? 'Crée, vends et gagne — tout en un seul endroit.' : 'Create, sell & earn — all in one place.')}
            </p>
          </motion.div>

          {/* Action panel — gold-framed surface, same language as the certificate & sign-in */}
          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-[26px] p-[1.5px] shadow-[0_40px_120px_-50px_hsl(var(--brand-blue)/0.55)]"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--brand-blue-soft)/0.9), hsl(var(--brand-blue)/0.45) 35%, hsl(var(--brand-blue-soft)/0.85) 55%, hsl(var(--brand-blue)/0.45) 80%, hsl(var(--brand-blue-soft)/0.9))',
            }}
          >
            {/* Light that travels around the component's border */}
            <motion.span
              aria-hidden
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 250deg, hsl(0 0% 100% / 0.85) 320deg, hsl(0 0% 100% / 0.15) 350deg, transparent 360deg)',
              }}
            />


            <div className="relative z-20 rounded-[24px] bg-[hsl(var(--cert-paper))]/95 dark:bg-[#0e0d16]/95 backdrop-blur-xl p-3 sm:p-4">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {actions.map((action, idx) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    className={cn(
                      'relative w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl text-left group overflow-hidden',
                      'border border-[hsl(var(--brand-blue))]/20 dark:border-primary/15',
                      'bg-[hsl(var(--cert-paper-warm))]/70 dark:bg-white/[0.03]',
                      'transition-all duration-200 active:scale-[0.98]',
                      'hover:-translate-y-0.5 hover:border-[hsl(var(--brand-blue))]/50',
                      'hover:shadow-[0_18px_40px_-24px_hsl(var(--brand-blue)/0.6)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-blue))]/50',
                    )}
                  >
                    {/* Light looping around the button's edge */}
                    <motion.span
                      aria-hidden
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 10,
                        ease: 'linear',
                        repeat: Infinity,
                        delay: idx * 0.6,
                      }}
                      className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2 opacity-70"
                      style={{
                        background:
                          'conic-gradient(from 0deg, transparent 0deg, transparent 260deg, hsl(var(--brand-blue) / 0.35) 330deg, hsl(0 0% 100% / 0.18) 352deg, transparent 360deg)',
                      }}
                    />
                    {/* Masks the rotating light so only a thin edge glow remains */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-[1.5px] rounded-[14px] bg-[hsl(var(--cert-paper))] dark:bg-[#0e0d16]"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-[1.5px] rounded-[14px] bg-[hsl(var(--cert-paper-warm))]/70 dark:bg-white/[0.03]"
                    />

                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--brand-blue)/0.12),transparent_60%)]"
                    />


                    <div className={cn(
                      'relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-current/15 transition-transform duration-200 group-hover:scale-[1.06]',
                      action.iconBg, action.iconColor
                    )}>
                      <action.icon className="h-5 w-5" />
                    </div>

                    <div className="relative flex-1 min-w-0">
                      <div className="font-bold text-[13px] sm:text-sm text-foreground leading-tight">{isFr ? action.titleFr : action.titleEn}</div>
                      <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">{isFr ? action.descFr : action.descEn}</div>
                    </div>
                    <ArrowRight className="relative h-4 w-4 text-muted-foreground/70 group-hover:text-[hsl(var(--brand-blue))] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>


          {/* Footer link */}
          <motion.div variants={item} className="text-center pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-auto min-h-9 max-w-full whitespace-normal rounded-xl border-[hsl(var(--brand-blue))]/30 bg-transparent px-4 py-2 text-xs font-semibold leading-snug backdrop-blur-xl hover:border-[hsl(var(--brand-blue))]/60 hover:bg-[hsl(var(--brand-blue))]/10"
              onClick={() => navigate('/landing')}
            >
              {isFr ? 'En savoir plus sur SiteViral' : 'Learn more about SiteViral'}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 shrink-0" />

            </Button>

          </motion.div>
        </motion.div>
      </main>

      {/* Empty-state prompts */}
      <Dialog open={!!prompt} onOpenChange={(o) => !o && setPrompt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              {prompt === 'revenue'
                ? (isFr ? 'Pas encore de revenus' : 'No revenue yet')
                : (isFr ? 'Aucun achat pour l’instant' : 'No purchases yet')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {prompt === 'revenue'
                ? (isFr
                    ? 'Commence par créer quelque chose à vendre — tes revenus apparaîtront ici.'
                    : 'Start by creating something to sell — your revenue will show up here.')
                : (isFr
                    ? 'Découvre des livres, formations et ressources à acheter.'
                    : 'Discover books, formations and resources to buy.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-1">
            {prompt === 'revenue' ? (
              <>
                <Button className="h-11 justify-start gap-2.5 rounded-xl font-semibold"
                  onClick={() => { setPrompt(null); navigate('/ecrire'); }}>
                  <BookOpen className="h-4 w-4" />
                  {isFr ? 'Écrire un livre en 5 min' : 'Write a book in 5 min'}
                </Button>
                <Button variant="outline" className="h-11 justify-start gap-2.5 rounded-xl font-semibold"
                  onClick={() => { setPrompt(null); navigate(resolveRoute('sell')); }}>
                  <Store className="h-4 w-4" />
                  {isFr ? 'Vendre du contenu' : 'Sell content'}
                </Button>
              </>
            ) : (
              <Button className="h-11 justify-start gap-2.5 rounded-xl font-semibold"
                onClick={() => { setPrompt(null); navigate('/discover'); }}>
                <Compass className="h-4 w-4" />
                {isFr ? 'Découvrir des produits' : 'Discover products'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
