import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import heroImg from '@/assets/landing-hero-new.jpg';
import { useState, useEffect } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

const personas = [
  {
    headline: 'Votre contenu est dispersé.\nVos revenus aussi.',
    sub: 'Centralisez tout sur une seule plateforme : vendez vos ressources, collectez des dons, gérez votre communauté. Zéro abonnement.',
    cta: 'Créer ma plateforme',
    ctaPath: '/auth?mode=signup',
  },
  {
    headline: 'Zéro contenu à créer.\nJuste partager et gagner.',
    sub: 'Devenez ambassadeur : partagez les ressources d\'autres créateurs et touchez jusqu\'à 50% de commission sur chaque vente.',
    cta: 'Devenir ambassadeur',
    ctaPath: '/auth?mode=signup',
  },
  {
    headline: 'Des milliers de ressources.\nUn seul endroit.',
    sub: 'E-books, formations, audio, vidéos — achetez et soutenez des créateurs. Paiement Mobile Money ou carte en 1 clic.',
    cta: 'Explorer les ressources',
    ctaPath: '/discover',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function LandingHero() {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 4000;
    const tickMs = 40;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += tickMs;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        setActiveIdx((prev) => (prev + 1) % personas.length);
        elapsed = 0;
        setProgress(0);
      }
    }, tickMs);
    return () => clearInterval(timer);
  }, [activeIdx]);

  const persona = personas[activeIdx];

  return (
    <section className="relative pt-14 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
      </div>
      <div className="relative z-10 container max-w-5xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} className="text-center space-y-6">
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border bg-card/50 text-muted-foreground gap-1.5">
              <Sparkles className="h-3 w-3" /> Infrastructure SaaS — Propulsé par Hacktualiz Inc.
            </Badge>
          </motion.div>

          {/* Animated headline */}
          <div className="min-h-[120px] sm:min-h-[140px] lg:min-h-[170px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={activeIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight whitespace-pre-line"
              >
                {persona.headline.split('\n').map((line, i) => (
                  <span key={i}>
                    {i === 1 ? <span className="text-primary">{line}</span> : line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </motion.h1>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${activeIdx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              {persona.sub}
            </motion.p>
          </AnimatePresence>

          {/* Social proof counters */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-2">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground"><AnimatedCounter target={1200} />+</p>
              <p className="text-[11px] text-muted-foreground">Créateurs actifs</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground"><AnimatedCounter target={15000} />+</p>
              <p className="text-[11px] text-muted-foreground">Ressources vendues</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground"><AnimatedCounter target={8} /></p>
              <p className="text-[11px] text-muted-foreground">Pays actifs</p>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" className="px-8 gap-2 h-13 text-base w-full sm:w-auto group" onClick={() => navigate(persona.ctaPath)}>
              {persona.cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 gap-2 text-base w-full sm:w-auto" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <Play className="h-4 w-4" /> Comment ça marche ?
            </Button>
          </motion.div>

          {/* Persona dots with progress */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {personas.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveIdx(i); setProgress(0); }}
                className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: i === activeIdx ? 32 : 8 }}
                aria-label={`Voir persona ${i + 1}`}
              >
                <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                {i === activeIdx && (
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-75"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
