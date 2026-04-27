import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PenLine, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { useExperiment } from '@/hooks/useExperiment';
import { RotatingWords } from './RotatingWords';
import { GradientText } from './GradientText';
import { useI18n } from '@/i18n/I18nContext';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function LandingHeroManifesto() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // A/B test: A = creator-focused (current), B = established-pro positioning
  const heroVariant = useExperiment('hero_positioning_v1', ['a', 'b'] as const, user?.id);
  useEffect(() => {
    trackEvent('experiment_exposure', { exp: 'hero_positioning_v1', variant: heroVariant }, user?.id);
  }, [heroVariant, user?.id]);

  const badgeText = heroVariant === 'b'
    ? (isFr ? 'Pour coachs, formateurs et créateurs établis' : 'For coaches, trainers and established creators')
    : (isFr ? 'Tout le monde peut devenir auteur' : 'Anyone can become an author');

  const subText = heroVariant === 'b'
    ? (isFr
        ? <>Garde <strong className="text-white">100% de tes ventes en Pro</strong>. Mobile Money inclus. Ambassadeurs intégrés.</>
        : <><strong className="text-white">Keep 100% of your sales</strong> on Pro. Mobile Money included. Built-in ambassadors.</>)
    : (isFr
        ? <>En <strong className="text-white">5 minutes</strong>. Sans banque. Dans le <strong className="text-white">monde entier</strong>.</>
        : <>In <strong className="text-white">5 minutes</strong>. No bank needed. <strong className="text-white">Worldwide</strong>.</>);
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Clean dark gradient - no dots, no clutter */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,70%,8%)] via-[hsl(220,60%,12%)] to-background" />

      {/* Subtle ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[160px] opacity-15 bg-primary" />

      <div className="relative z-10 container max-w-5xl px-4 py-24 sm:py-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center space-y-8"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-1.5 bg-white/5 text-white/80 border border-white/10 rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 animate-[pulse_2s_ease-in-out_infinite] text-accent" />
            {isFr ? 'Tout le monde peut devenir auteur' : 'Anyone can become an author'}
          </motion.div>

          {/* Main headline */}
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white">
            <GradientText>{isFr ? 'Écris.' : 'Write.'}</GradientText>{' '}
            <span className="text-accent">{isFr ? 'Vends.' : 'Sell.'}</span>{' '}
            <RotatingWords
              words={isFr ? ['Gagne.', 'Grandis.', 'Impacte.', 'Brille.'] : ['Earn.', 'Grow.', 'Impact.', 'Shine.']}
              interval={2200}
              className="text-white"
            />
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            {isFr ? (
              <>En <strong className="text-white">5 minutes</strong>. Sans banque. Dans le <strong className="text-white">monde entier</strong>.</>
            ) : (
              <>In <strong className="text-white">5 minutes</strong>. No bank needed. <strong className="text-white">Worldwide</strong>.</>
            )}
          </motion.p>

          {/* Country flags */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-lg">
            {['🇬🇭', '🇰🇪', '🇨🇮', '🇳🇬', '🇿🇦', '🇺🇸', '🇬🇧', '🇫🇷'].map(flag => (
              <span key={flag} className="hover:scale-125 transition-transform cursor-default text-xl">{flag}</span>
            ))}
            <span className="text-xs text-white/40 ml-1">+ 150 {isFr ? 'pays' : 'countries'}</span>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="px-8 gap-2.5 h-14 text-base w-full sm:w-auto group relative overflow-hidden shadow-lg shadow-primary/30"
              onClick={() => { trackEvent('cta_click', { cta: 'write_book', source: 'landing_hero' }, user?.id); navigate(user ? '/ecrire' : '/auth?mode=signup&intent=writer'); }}
            >
              <PenLine className="h-5 w-5" />
              ✏️ {isFr ? 'Écrire mon livre' : 'Write my book'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 gap-2.5 text-base w-full sm:w-auto border-white/20 text-white hover:bg-white/5 bg-transparent"
              onClick={() => { trackEvent('cta_click', { cta: 'earn_sharing', source: 'landing_hero' }, user?.id); navigate(user ? '/gagner' : '/auth?mode=signup&intent=ambassador'); }}
            >
              <Share2 className="h-5 w-5" />
              💰 {isFr ? 'Gagner en partageant' : 'Earn by sharing'}
            </Button>
          </motion.div>

          {/* Discover */}
          <motion.div variants={fadeUp}>
            <button
              onClick={() => navigate('/discover')}
              className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
            >
              {isFr ? 'Ou simplement explorer les ressources →' : 'Or simply explore resources →'}
            </button>
          </motion.div>

          {/* Value props */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 pt-8">
            {[
              { value: '5 min', label: isFr ? 'pour écrire ton livre' : 'to write your book', color: 'text-primary' },
              { value: isFr ? '0 frais' : '$0 fees', label: isFr ? "d'abonnement" : 'subscription', color: 'text-accent' },
              { value: '5-50%', label: isFr ? 'de commission ambassadeur' : 'ambassador commission', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
                className="text-center"
              >
                <p className={`text-2xl sm:text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-white/40 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="text-[11px] text-white/30 pt-2">
            ✓ Mobile Money & {isFr ? 'Carte' : 'Card'} · ✓ {isFr ? 'Contenus protégés' : 'Content protected'} · ✓ {isFr ? 'Tes lecteurs vendent pour toi' : 'Your readers sell for you'}
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
