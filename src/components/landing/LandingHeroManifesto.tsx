import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PenLine, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { RotatingWords } from './RotatingWords';
import { GradientText } from './GradientText';
import { useI18n } from '@/i18n/I18nContext';
import dashboardScreenshot from '@/assets/screenshots/dashboard-real.png';

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

  return (
    <section className="relative pt-14 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-accent/3 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,hsl(var(--accent)/0.08),transparent_60%)]" />

      {/* Floating orbs for depth */}
      <motion.div
        className="absolute top-32 left-[10%] h-64 w-64 rounded-full bg-primary/5 blur-3xl"
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-48 right-[10%] h-48 w-48 rounded-full bg-accent/5 blur-3xl"
        animate={{ y: [0, 15, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      <div className="relative z-10 container max-w-5xl px-4 pt-20 pb-10 sm:pt-28 sm:pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center space-y-7"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full px-3.5 py-1.5 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 animate-[pulse_2s_ease-in-out_infinite]" />
            {isFr ? 'Tout le monde peut devenir auteur' : 'Anyone can become an author'}
          </motion.div>

          {/* Main headline with rotating words */}
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
            <GradientText>{isFr ? 'Écris.' : 'Write.'}</GradientText>{' '}
            <span className="text-accent">{isFr ? 'Vends.' : 'Sell.'}</span>{' '}
            <RotatingWords
              words={isFr ? ['Gagne.', 'Grandis.', 'Impacte.', 'Brille.'] : ['Earn.', 'Grow.', 'Impact.', 'Shine.']}
              interval={2200}
              className="text-foreground"
            />
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isFr ? (
              <>En <strong className="text-foreground">5 minutes</strong>. Sans banque. Dans le <strong className="text-foreground">monde entier</strong>.</>
            ) : (
              <>In <strong className="text-foreground">5 minutes</strong>. No bank needed. <strong className="text-foreground">Worldwide</strong>.</>
            )}
          </motion.p>

          {/* Country flags strip */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-1.5 text-lg">
            {['🇬🇭', '🇰🇪', '🇨🇮', '🇳🇬', '🇿🇦', '🇺🇸', '🇬🇧', '🇫🇷'].map(flag => (
              <span key={flag} className="grayscale-[30%] hover:grayscale-0 transition-all cursor-default">{flag}</span>
            ))}
            <span className="text-xs text-muted-foreground ml-1">+ 150 {isFr ? 'pays' : 'countries'}</span>
          </motion.div>

          {/* 2 CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="px-8 gap-2.5 h-14 text-base w-full sm:w-auto group cta-glow relative overflow-hidden"
              onClick={() => { trackEvent('cta_click', { cta: 'write_book', source: 'landing_hero' }, user?.id); navigate(user ? '/ecrire' : '/auth?mode=signup&intent=writer'); }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <PenLine className="h-5 w-5" />
              ✏️ {isFr ? 'Écrire mon livre' : 'Write my book'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 gap-2.5 text-base w-full sm:w-auto border-accent/30 text-accent hover:bg-accent/5"
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
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              {isFr ? 'Ou simplement explorer les ressources →' : 'Or simply explore resources →'}
            </button>
          </motion.div>

          {/* Value props */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-6 text-center">
            {[
              { value: '5 min', label: isFr ? 'pour écrire ton livre' : 'to write your book', color: 'text-primary' },
              { value: isFr ? '0 frais' : '$0 fees', label: isFr ? "d'abonnement" : 'subscription', color: 'text-accent' },
              { value: '5-50%', label: isFr ? 'de commission ambassadeur' : 'ambassador commission', color: 'text-emerald-500' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
              >
                <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="text-[11px] text-muted-foreground/60">
            ✓ Mobile Money & {isFr ? 'Carte' : 'Card'} · ✓ {isFr ? 'Contenus protégés' : 'Content protected'} · ✓ {isFr ? 'Tes lecteurs vendent pour toi' : 'Your readers sell for you'}
          </motion.p>
        </motion.div>

        {/* ── Hero Screenshot ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 sm:mt-16 relative mx-auto max-w-4xl"
        >
          <div className="absolute -inset-4 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl overflow-hidden border border-border/60 shadow-premium bg-card">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border/40">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-[10px] text-muted-foreground font-mono bg-background/60 rounded px-2 py-0.5">
                siteviral.com/admin/sales
              </span>
            </div>
            <img
              src={dashboardScreenshot}
              alt={isFr ? "Tableau de bord des ventes SiteViral" : "SiteViral sales dashboard"}
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
