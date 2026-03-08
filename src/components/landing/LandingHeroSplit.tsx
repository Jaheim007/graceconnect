import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Share2, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { RotatingWords } from './RotatingWords';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function LandingHeroSplit() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGagner = () => navigate(user ? '/gagner' : '/auth?intent=ambassador');
  const handleVendre = () => navigate(user ? '/admin' : '/auth?intent=creator');

  return (
    <section className="relative pt-14 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      {/* Floating orb */}
      <motion.div
        className="absolute top-24 right-[15%] h-56 w-56 rounded-full bg-primary/5 blur-3xl"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 container max-w-4xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center space-y-6"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3 w-3 animate-[pulse_2s_ease-in-out_infinite]" /> La plateforme où tout le monde gagne
          </motion.div>

          {/* Main headline with rotating words */}
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight">
            Gagnez de l'argent{' '}
            <span className="text-accent">en partageant</span>.
            <br />
            Vendez plus grâce à{' '}
            <RotatingWords
              words={['vos ambassadeurs', 'votre communauté', 'vos lecteurs']}
              interval={2500}
              className="text-primary"
            />
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            La plateforme où chaque ressource digitale devient une{' '}
            <strong className="text-foreground">source de revenu</strong>.
          </motion.p>

          {/* 2 CTAs with shimmer */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="px-8 gap-2 h-13 text-base w-full sm:w-auto group cta-glow relative overflow-hidden"
              onClick={handleGagner}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Share2 className="h-4 w-4" />
              💰 Je veux gagner
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 gap-2 text-base w-full sm:w-auto"
              onClick={handleVendre}
            >
              <Building2 className="h-4 w-4" />
              🏢 Je veux vendre
            </Button>
          </motion.div>

          {/* Discrete discover link */}
          <motion.div variants={fadeUp}>
            <button
              onClick={() => navigate('/discover')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Explorer les ressources →
            </button>
          </motion.div>

          {/* Value props strip — staggered */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-center">
            {[
              { value: '0 FCFA', label: "d'abonnement", color: 'text-primary' },
              { value: '5-50%', label: 'de commission', color: 'text-accent' },
              { value: '60 sec', label: 'pour commencer', color: 'text-primary' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
              >
                <p className={`text-lg sm:text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="text-[11px] text-muted-foreground/60">
            ✓ Pas de carte requise · ✓ Pas d'abonnement · ✓ Mobile Money & Carte
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
