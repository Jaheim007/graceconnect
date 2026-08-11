import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BarChart3, ShoppingBag, GraduationCap, Users, Megaphone, Settings, Compass, HandCoins, Gift, Menu as MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

const TOUR_VERSION = 'v5';
const TOUR_STORAGE_KEY = `gc_onboarding_done_${TOUR_VERSION}`;
/** Any of these means the user already went through onboarding — never replay it. */
const LEGACY_TOUR_KEYS = [TOUR_STORAGE_KEY];

interface TourStep {
  icon: React.ReactNode;
  /** First matching selector becomes the spotlight target. */
  targets: string[];
  title_fr: string;
  title_en: string;
  desc_fr: string;
  desc_en: string;
  tip_fr: string;
  tip_en: string;
  /** Keep this step even when no matching nav item is found. */
  always?: boolean;
  /** Tapping the highlighted element activates it (e.g. opens the menu) instead of closing the tour. */
  clickTarget?: boolean;
}

/**
 * Mobile guided tour — walks through the real bottom navigation, one tab at a
 * time, and finishes by opening the Menu so the user discovers everything they
 * can create from there.
 */
const MOBILE_STEPS: TourStep[] = [
  {
    icon: <BarChart3 className="h-5 w-5" />,
    targets: ['[data-tour="bottomnav-overview"]'],
    always: true,
    title_fr: 'Accueil',
    title_en: 'Home',
    desc_fr: 'Votre point de départ : raccourcis pour écrire un livre, créer une formation ou publier un produit.',
    desc_en: 'Your starting point: shortcuts to write a book, build a course, or publish a product.',
    tip_fr: 'Revenez ici quand vous ne savez pas quoi faire ensuite.',
    tip_en: 'Come back here whenever you are unsure what to do next.',
  },
  {
    icon: <Compass className="h-5 w-5" />,
    targets: ['[data-tour="bottomnav-explore"]'],
    title_fr: 'Explorer',
    title_en: 'Explore',
    desc_fr: 'Découvrez les livres, formations et ressources publiés sur SiteViral — et inspirez-vous.',
    desc_en: 'Discover books, courses, and resources published on SiteViral — and get inspired.',
    tip_fr: 'Utilisez la recherche pour trouver un thème précis.',
    tip_en: 'Use search to find a specific topic.',
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    targets: ['[data-tour="bottomnav-purchases"]'],
    title_fr: 'Achats',
    title_en: 'Purchases',
    desc_fr: 'Tout ce que vous achetez reste ici, à vie : livres, formations, certificats et téléchargements.',
    desc_en: 'Everything you buy lives here forever: books, courses, certificates, and downloads.',
    tip_fr: 'Vos accès restent valables même si le créateur retire le produit.',
    tip_en: 'Your access stays valid even if the creator removes the product.',
  },
  {
    icon: <HandCoins className="h-5 w-5" />,
    targets: ['[data-tour="bottomnav-earn"]', '[data-tour="bottomnav-messages"]'],
    title_fr: 'Gagner',
    title_en: 'Earn',
    desc_fr: 'Partagez les produits des autres et touchez une commission sur chaque vente.',
    desc_en: 'Share other creators’ products and earn a commission on every sale.',
    tip_fr: 'Votre lien de partage est suivi automatiquement.',
    tip_en: 'Your share link is tracked automatically.',
  },
  {
    icon: <MenuIcon className="h-5 w-5" />,
    targets: ['[data-tour="bottomnav-menu"]'],
    always: true,
    clickTarget: true,
    title_fr: 'Menu — tout créer',
    title_en: 'Menu — create anything',
    desc_fr: 'Appuyez sur Menu : vous y trouverez vos produits, formations, paiements, réglages et la création de plateforme.',
    desc_en: 'Tap Menu: it holds your products, courses, payouts, settings, and platform creation.',
    tip_fr: 'Appuyez sur la zone en surbrillance pour ouvrir le menu.',
    tip_en: 'Tap the highlighted area to open the menu.',
  },
];

function buildSteps(isChurch: boolean): TourStep[] {
  return [
  {
    icon: <BarChart3 className="h-5 w-5" />,
    targets: ['[data-nav-route="/admin"]', '[data-nav-route="/dashboard"]'],
    title_fr: 'Votre tableau de bord',
    title_en: 'Your dashboard',
    desc_fr: "Ici, vous voyez en un coup d'œil vos revenus, vos membres et vos performances.",
    desc_en: 'Here you can see your revenue, members, and performance at a glance.',
    tip_fr: 'Consultez-le régulièrement pour suivre votre croissance.',
    tip_en: 'Check it regularly to track your growth.',
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    targets: ['[data-nav-route="/admin/products"]', '[data-nav-route="/admin/sales"]'],
    title_fr: 'Créer et vendre',
    title_en: 'Create & sell',
    desc_fr: 'Créez ebooks, templates ou fichiers numériques, fixez votre prix et vendez immédiatement.',
    desc_en: 'Create ebooks, templates, or digital files, set your price, and start selling immediately.',
    tip_fr: "L'IA peut générer un ebook complet en quelques clics.",
    tip_en: 'AI can generate a complete ebook in a few clicks.',
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    targets: ['[data-nav-route="/admin/programs"]'],
    title_fr: 'Vos formations',
    title_en: 'Your courses',
    desc_fr: 'Construisez des formations avec leçons, quiz et certificats — ou laissez l\'IA les générer.',
    desc_en: 'Build courses with lessons, quizzes, and certificates — or let AI generate them.',
    tip_fr: 'Un document PDF peut devenir une formation complète.',
    tip_en: 'A single PDF can become a full course.',
  },
  {
    // Giving (churches) vs Campaigns (every other platform type) — the label
    // must match exactly what the highlighted nav item says.
    icon: <Gift className="h-5 w-5" />,
    targets: ['[data-nav-route="/admin/campaigns"]'],
    title_fr: isChurch ? 'Recevoir des dons' : 'Vos campagnes',
    title_en: isChurch ? 'Receive giving' : 'Your campaigns',
    desc_fr: isChurch
      ? 'Votre page de dons : offrandes, dîmes et dons ponctuels, avec un lien à partager.'
      : 'Lancez une collecte ou acceptez des cadeaux de votre audience, avec un lien à partager.',
    desc_en: isChurch
      ? 'Your giving page: offerings, tithes, and one-time gifts, with a link you can share.'
      : 'Launch a fundraiser or accept gifts from your audience, with a link you can share.',
    tip_fr: isChurch
      ? 'La page de dons reste accessible même sans objectif fixé.'
      : 'Fixez un objectif pour afficher une barre de progression.',
    tip_en: isChurch
      ? 'Your giving page stays reachable even without a goal set.'
      : 'Set a goal to display a progress bar.',
  },
  {
    icon: <Megaphone className="h-5 w-5" />,
    targets: ['[data-nav-route="/admin/announcements"]', '[data-nav-route="/admin/media"]', '[data-nav-route="/admin/events"]'],
    title_fr: 'Parler à votre audience',
    title_en: 'Reach your audience',
    desc_fr: 'Annonces, médias et événements pour garder votre communauté engagée.',
    desc_en: 'Announcements, media, and events to keep your community engaged.',
    tip_fr: 'Épinglez vos annonces importantes.',
    tip_en: 'Pin your important announcements.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    targets: ['[data-tour="org-switcher"]'],
    always: true,
    title_fr: 'Votre plateforme',
    title_en: 'Your platform',
    desc_fr: 'Basculez entre vos plateformes ou créez-en une nouvelle depuis ce sélecteur.',
    desc_en: 'Switch between your platforms — or create a new one — from this selector.',
    tip_fr: 'Chaque plateforme a ses propres produits et paiements.',
    tip_en: 'Each platform has its own products and payouts.',
  },
  {
    icon: <Settings className="h-5 w-5" />,
    targets: ['[data-tour="nav-settings"]', '[data-nav-route="/admin/settings"]'],
    always: true,
    title_fr: 'Personnaliser',
    title_en: 'Customize',
    desc_fr: 'Logo, bannière, couleurs, sections publiques et paiements se règlent ici.',
    desc_en: 'Logo, banner, colors, public sections, and payouts all live here.',
    tip_fr: 'Complétez le KYC pour recevoir vos paiements.',
    tip_en: 'Complete KYC to receive your payouts.',
  },
  ];
}


interface Rect { top: number; left: number; width: number; height: number }

function findEl(targets: string[]): HTMLElement | null {
  for (const sel of targets) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

function measure(targets: string[]): Rect | null {
  const el = findEl(targets);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Bring the spotlight target fully into view (sidebar or page scroll containers). */
function revealTarget(targets: string[]) {
  const el = findEl(targets);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const needsScroll = r.top < 96 || r.bottom > vh - 96;
  if (needsScroll) {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } catch {
      el.scrollIntoView();
    }
  }
}

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  /** Only steps whose target actually exists in the current navigation. */
  const [steps, setSteps] = useState<TourStep[]>(() => buildSteps(false));
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const isChurch = currentOrg?.siteviral_type === 'church';

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHubRoute = location.pathname === '/' || location.pathname.startsWith('/dashboard');

  useEffect(() => {
    if (!user || !(isAdminRoute || isHubRoute)) {
      setActive(false);
      return;
    }
    // Anyone who already finished this or a previous onboarding never sees it again.
    const done = LEGACY_TOUR_KEYS.some((k) => localStorage.getItem(k));
    if (done) return;
    const t = setTimeout(() => {
      const base = window.innerWidth < 768 ? MOBILE_STEPS : buildSteps(isChurch);
      const available = base.filter((s) => s.always || !!findEl(s.targets));
      setSteps(available.length > 0 ? available : base.filter((s) => s.always));
      setStep(0);
      setActive(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [user, isAdminRoute, isHubRoute, isChurch]);


  const current = steps[step] ?? steps[0];

  // Track the spotlight target position (resize / scroll aware)
  useLayoutEffect(() => {
    if (!active || !current) return;
    revealTarget(current.targets);
    const update = () => setRect(measure(current.targets));
    update();
    const id = window.setInterval(update, 400);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [active, step, current]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setActive(false);
  }, []);

  const next = useCallback(() => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else finish();
  }, [step, steps.length, finish]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);


  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, next, prev, finish]);

  if (!active || !current) return null;

  const pad = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isMobile = vw < 768;
  const cardW = isMobile ? vw - 24 : Math.min(360, vw - 32);

  // Place the card beside the highlighted element when possible
  let cardStyle: React.CSSProperties = {
    left: (vw - cardW) / 2,
    top: Math.max(24, vh / 2 - 170),
  };
  let arrowSide: 'left' | 'top' | null = null;
  if (isMobile) {
    // Mobile: sheet on the opposite side of the highlighted element so the
    // real UI stays visible (bottom nav steps push the card to the top).
    const targetIsLow = !rect || rect.top > vh * 0.45;
    cardStyle = targetIsLow
      ? { left: 12, top: 16, bottom: 'auto' as any }
      : { left: 12, bottom: 96, top: 'auto' as any };
  } else if (rect) {
    const spaceRight = vw - (rect.left + rect.width);
    if (spaceRight > cardW + 48) {
      cardStyle = {
        left: rect.left + rect.width + 28,
        top: Math.min(Math.max(16, rect.top + rect.height / 2 - 150), vh - 340),
      };
      arrowSide = 'left';
    } else {
      cardStyle = {
        left: Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 16),
        top: rect.top + rect.height + 32 > vh - 320 ? Math.max(16, rect.top - 320) : rect.top + rect.height + 28,
      };
      arrowSide = 'top';
    }
  }


  return createPortal(
    <div className="fixed inset-0 z-[10000]">
      {/* Dimmed backdrop with a real cut-out around the target */}
      {rect ? (
        <motion.div
          aria-hidden
          className="pointer-events-auto absolute rounded-2xl"
          onClick={() => {
            if (current.clickTarget) {
              findEl(current.targets)?.click();
              next();
              return;
            }
            finish();
          }}
          initial={false}
          animate={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ boxShadow: `0 0 0 9999px rgba(3,7,18,${isMobile ? 0.55 : 0.72})` }}
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0',
            isMobile ? 'bg-[rgba(3,7,18,0.45)]' : 'bg-[rgba(3,7,18,0.72)] backdrop-blur-[2px]',
          )}
          onClick={finish}
        />
      )}


      {/* Glowing ring + pulse on the target */}
      {rect && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-2xl border-2 border-primary"
            initial={false}
            animate={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ boxShadow: '0 0 0 4px hsl(var(--primary)/0.22), 0 0 40px 6px hsl(var(--primary)/0.35)' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-2xl border border-primary/60"
            initial={false}
            animate={{
              top: rect.top - pad,
              left: rect.left - pad,
              width: rect.width + pad * 2,
              height: rect.height + pad * 2,
              opacity: [0.7, 0, 0.7],
              scale: [1, 1.06, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Pointer arrow aimed at the real element (desktop only) */}
          <motion.div
            key={`arrow-${step}`}
            aria-hidden
            className={cn('pointer-events-none absolute text-primary', isMobile && 'hidden')}

            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={
              arrowSide === 'left'
                ? { top: rect.top + rect.height / 2 - 14, left: rect.left + rect.width + pad + 2 }
                : { top: rect.top + rect.height + pad + 2, left: rect.left + rect.width / 2 - 14 }
            }
          >
            <motion.div
              animate={arrowSide === 'left' ? { x: [0, -6, 0] } : { y: [0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className={arrowSide === 'left' ? 'rotate-180' : '-rotate-90'}>
                <path d="M5 12h11M11 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Coach card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: isMobile ? 1 : 0.96, y: isMobile ? 24 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: isMobile ? 1 : 0.96, y: isMobile ? 24 : -10 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          drag={isMobile ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => { if (isMobile && info.offset.y > 90) finish(); }}
          className={cn(
            'absolute border border-border/70 bg-card/95 shadow-elevated backdrop-blur-xl',
            isMobile ? 'rounded-3xl' : 'rounded-2xl',
          )}
          style={{ ...cardStyle, width: cardW }}
        >

          {arrowSide === 'left' && (
            <span aria-hidden className="absolute -left-1.5 top-10 h-3 w-3 rotate-45 border-b border-l border-border/70 bg-card/95" />
          )}
          {arrowSide === 'top' && (
            <span aria-hidden className="absolute -top-1.5 left-10 h-3 w-3 rotate-45 border-l border-t border-border/70 bg-card/95" />
          )}

          <div className={cn('h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent', isMobile ? 'rounded-t-3xl' : 'rounded-t-2xl')} />
          {isMobile && (
            <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
          )}


          <button
            onClick={finish}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
            aria-label={isFr ? 'Fermer' : 'Close'}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {isFr ? 'Étape' : 'Step'} {step + 1} / {steps.length}
            </p>

            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {current.icon}
              </div>
              <h3 className="font-heading text-base font-bold leading-tight">
                {isFr ? current.title_fr : current.title_en}
              </h3>
            </div>

            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {isFr ? current.desc_fr : current.desc_en}
            </p>

            <div className="mb-5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
              <p className="text-xs font-medium leading-relaxed text-primary">
                {isFr ? current.tip_fr : current.tip_en}
              </p>
            </div>

            <div className="mb-4 flex justify-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`${isFr ? 'Étape' : 'Step'} ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40',
                  )}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={finish} className={cn('text-xs text-muted-foreground', isMobile ? 'h-11' : 'h-8')}>
                  {isFr ? 'Passer' : 'Skip'}
                </Button>
                {step > 0 && (
                  <Button variant="ghost" size="sm" onClick={prev} className={cn('gap-1 text-xs', isMobile ? 'h-11' : 'h-8')}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {isFr ? 'Retour' : 'Back'}
                  </Button>
                )}
              </div>
              <Button size="sm" onClick={next} className={cn('gap-1 text-xs', isMobile ? 'h-11 flex-1 max-w-[55%]' : 'h-8')}>
                {step === steps.length - 1
                  ? (isFr ? "C'est parti !" : "Let's go!")
                  : (isFr ? 'Suivant' : 'Next')}
                {step < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>

          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
