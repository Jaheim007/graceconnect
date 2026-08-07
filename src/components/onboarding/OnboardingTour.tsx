import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Zap, BarChart3, ShoppingBag, GraduationCap, Users, Megaphone, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

const TOUR_VERSION = 'v3';
const TOUR_STORAGE_KEY = `gc_onboarding_done_${TOUR_VERSION}`;

interface TourStep {
  icon: React.ReactNode;
  emoji: string;
  title_fr: string;
  title_en: string;
  desc_fr: string;
  desc_en: string;
  tip_fr: string;
  tip_en: string;
}

const STEPS: TourStep[] = [
  {
    icon: <BarChart3 className="h-6 w-6" />,
    emoji: '📊',
    title_fr: 'Votre tableau de bord',
    title_en: 'Your Dashboard',
    desc_fr: 'Bienvenue dans votre espace admin ! Ici, vous voyez en un coup d\'œil vos revenus, vos membres et vos performances.',
    desc_en: 'Welcome to your admin space! Here you can see your revenue, members, and performance at a glance.',
    tip_fr: '💡 Consultez-le régulièrement pour suivre votre croissance.',
    tip_en: '💡 Check it regularly to track your growth.',
  },
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    emoji: '🛍️',
    title_fr: 'Créer et vendre des produits',
    title_en: 'Create & Sell Products',
    desc_fr: 'Allez dans "Produits" pour créer des ebooks, templates ou fichiers numériques. Fixez votre prix et commencez à vendre immédiatement.',
    desc_en: 'Go to "Products" to create ebooks, templates, or digital files. Set your price and start selling immediately.',
    tip_fr: '💡 Vous pouvez aussi générer un ebook complet avec l\'IA en quelques clics !',
    tip_en: '💡 You can also generate a complete ebook with AI in just a few clicks!',
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    emoji: '🎓',
    title_fr: 'Créer des formations',
    title_en: 'Create Courses',
    desc_fr: 'Dans "Programmes", créez des formations structurées avec modules, leçons et quiz. L\'IA peut générer le contenu pour vous.',
    desc_en: 'In "Programs", create structured courses with modules, lessons, and quizzes. AI can generate the content for you.',
    tip_fr: '💡 Activez les slides interactives pour un apprentissage engageant.',
    tip_en: '💡 Enable interactive slides for engaging learning.',
  },
  {
    icon: <Megaphone className="h-6 w-6" />,
    emoji: '📢',
    title_fr: 'Communiquer avec votre audience',
    title_en: 'Communicate with Your Audience',
    desc_fr: 'Publiez des annonces, partagez des médias (vidéos, audio) et créez des événements pour engager votre communauté.',
    desc_en: 'Post announcements, share media (videos, audio), and create events to engage your community.',
    tip_fr: '💡 Épinglez vos annonces importantes pour qu\'elles restent visibles.',
    tip_en: '💡 Pin important announcements to keep them visible.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    emoji: '🤝',
    title_fr: 'Programme ambassadeur',
    title_en: 'Ambassador Program',
    desc_fr: 'Activez le programme ambassadeur pour permettre à d\'autres de promouvoir vos produits et gagner des commissions.',
    desc_en: 'Enable the ambassador program to let others promote your products and earn commissions.',
    tip_fr: '💡 Définissez un taux de commission attractif (10-30%) pour motiver vos ambassadeurs.',
    tip_en: '💡 Set an attractive commission rate (10-30%) to motivate your ambassadors.',
  },
  {
    icon: <Palette className="h-6 w-6" />,
    emoji: '🎨',
    title_fr: 'Personnaliser votre page',
    title_en: 'Customize Your Page',
    desc_fr: 'Visitez votre page publique et cliquez sur "Gérer ma page" pour modifier couleurs, bannière, logo et sections.',
    desc_en: 'Visit your public page and click "Manage page" to edit colors, banner, logo, and sections.',
    tip_fr: '💡 Glissez-déposez les sections pour réorganiser votre page comme vous le souhaitez.',
    tip_en: '💡 Drag and drop sections to rearrange your page as you wish.',
  },
];

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const { user } = useAuth();
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (!user || !isAdminRoute) {
      setActive(false);
      return;
    }
    const done = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setActive(true), 1200);
      return () => clearTimeout(t);
    }
  }, [user, isAdminRoute]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setActive(false);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  }, [step, finish]);

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  // Keyboard navigation
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

  if (!active) return null;

  const current = STEPS[step];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm relative overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={finish}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 z-10"
            aria-label={isFr ? 'Fermer' : 'Close'}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-5 sm:p-6">
            {/* Step counter */}
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">
              {isFr ? 'Étape' : 'Step'} {step + 1} / {STEPS.length}
            </p>

            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {current.icon}
              </div>
              <h3 className="text-lg font-bold leading-tight">
                {current.emoji} {isFr ? current.title_fr : current.title_en}
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {isFr ? current.desc_fr : current.desc_en}
            </p>

            {/* Tip */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2.5 mb-5">
              <p className="text-xs text-primary font-medium leading-relaxed">
                {isFr ? current.tip_fr : current.tip_en}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={finish}
                  className="h-8 text-xs text-muted-foreground"
                >
                  {isFr ? 'Passer' : 'Skip'}
                </Button>
                {step > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prev}
                    className="h-8 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {isFr ? 'Retour' : 'Back'}
                  </Button>
                )}
              </div>
              <Button
                size="sm"
                onClick={next}
                className="h-8 text-xs gap-1 bg-primary text-primary-foreground"
              >
                {step === STEPS.length - 1 ? (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    {isFr ? 'C\'est parti !' : 'Let\'s go!'}
                  </>
                ) : (
                  <>
                    {isFr ? 'Suivant' : 'Next'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
