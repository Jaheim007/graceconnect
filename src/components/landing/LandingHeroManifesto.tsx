import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PenLine, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { RotatingWords } from './RotatingWords';
import { GradientText } from './GradientText';

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

      <div className="relative z-10 container max-w-4xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
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
            <Sparkles className="h-3.5 w-3.5 animate-[pulse_2s_ease-in-out_infinite]" /> Tout le monde peut devenir auteur
          </motion.div>

          {/* Main headline with rotating words */}
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
            <GradientText>Écris.</GradientText>{' '}
            <span className="text-accent">Vends.</span>{' '}
            <RotatingWords
              words={['Gagne.', 'Grandis.', 'Impacte.', 'Brille.']}
              interval={2200}
              className="text-foreground"
            />
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            En <strong className="text-foreground">5 minutes</strong>. 
            Sans banque. 
            Dans le <strong className="text-foreground">monde entier</strong>.
          </motion.p>

          {/* 2 CTAs with hover animation */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="px-8 gap-2.5 h-14 text-base w-full sm:w-auto group cta-glow relative overflow-hidden"
              onClick={() => { trackEvent('cta_click', { cta: 'ecrire_mon_livre', source: 'landing_hero' }, user?.id); navigate(user ? '/ecrire' : '/auth?mode=signup&intent=writer'); }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <PenLine className="h-5 w-5" />
              ✏️ Écrire mon livre
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 gap-2.5 text-base w-full sm:w-auto border-accent/30 text-accent hover:bg-accent/5"
              onClick={() => { trackEvent('cta_click', { cta: 'gagner_en_partageant', source: 'landing_hero' }, user?.id); navigate(user ? '/gagner' : '/auth?mode=signup&intent=ambassador'); }}
            >
              <Share2 className="h-5 w-5" />
              💰 Gagner en partageant
            </Button>
          </motion.div>

          {/* Discrete discover */}
          <motion.div variants={fadeUp}>
            <button
              onClick={() => navigate('/discover')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Ou simplement explorer les ressources →
            </button>
          </motion.div>

          {/* Value props strip — staggered entry */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-6 text-center">
            {[
              { value: '5 min', label: 'pour écrire ton livre', color: 'text-primary' },
              { value: '0 FCFA', label: "d'abonnement", color: 'text-accent' },
              { value: '5-50%', label: 'de commission ambassadeur', color: 'text-emerald-500' },
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
            ✓ Mobile Money & Carte · ✓ Tes contenus sont protégés · ✓ Tes lecteurs vendent pour toi
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
