import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import heroImg from '@/assets/landing-hero-new.jpg';
import { useState, useEffect } from 'react';


const personas = [
  {
    badge: '🏢 Organisations & Leaders',
    headline: 'Votre plateforme digitale\nmonétisée, clé en main.',
    sub: (<>Centralisez vos ressources, <strong className="text-foreground">vendez</strong>, <strong className="text-foreground">collectez des dons</strong> — et bénéficiez d'une <strong className="text-accent">armée d'ambassadeurs</strong> qui <strong className="text-accent">diffusent et vendent pour vous</strong>.</>),
    cta: 'Créer ma plateforme gratuitement',
    ctaPath: '/auth?mode=signup',
    bullets: ['Boutique numérique complète', 'Armée d\'ambassadeurs intégrée', 'Dons & offrandes Mobile Money'],
  },
  {
    badge: '🚀 Ambassadeurs',
    headline: 'Zéro contenu à créer.\nJuste partager et gagner.',
    sub: (<><strong className="text-foreground">Partagez les ressources des autres</strong> et touchez de <strong className="text-accent">5% à 50% de commission</strong> sur <strong className="text-accent">chaque vente</strong>. Sur Siteviral, <strong className="text-foreground">tout le monde gagne</strong>.</>),
    cta: 'Devenir ambassadeur maintenant',
    ctaPath: '/auth?mode=signup',
    bullets: ['5% à 50% de commission', 'Lien de partage en 1 clic', 'Versement automatique'],
  },
  {
    badge: '🛒 Acheteurs',
    headline: 'Des ressources de qualité.\nUn seul endroit.',
    sub: (<>E-books, audio, vidéos, documents — <strong className="text-foreground">achetez et soutenez</strong> des <strong className="text-accent">créateurs et organisations</strong>. Paiement <strong className="text-foreground">Mobile Money ou carte</strong> en 1 clic.</>),
    cta: 'Explorer les ressources',
    ctaPath: '/discover',
    bullets: ['Accès instantané après achat', 'Paiement Mobile Money & Carte', 'Bibliothèque personnelle'],
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
    const duration = 4500;
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
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
      </div>
      <div className="relative z-10 container max-w-5xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} className="text-center space-y-5">
          
          {/* Persona badge */}
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${activeIdx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border bg-card/60 text-foreground gap-1.5 font-semibold">
                  {persona.badge}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Animated headline */}
          <div className="min-h-[110px] sm:min-h-[140px] lg:min-h-[160px] flex items-center justify-center">
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

          {/* Quick bullets */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`bullets-${activeIdx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
            >
              {persona.bullets.map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" /> {b}
                </span>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Value props instead of fake stats */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-2">
            <div className="text-center">
              <p className="text-lg sm:text-xl font-extrabold text-primary">0 FCFA</p>
              <p className="text-[11px] text-muted-foreground">d'abonnement</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-lg sm:text-xl font-extrabold text-primary">5-50%</p>
              <p className="text-[11px] text-muted-foreground">de commission</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-lg sm:text-xl font-extrabold text-primary">150+ pays</p>
              <p className="text-[11px] text-muted-foreground">Mobile Money & Carte</p>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" className="px-8 gap-2 h-13 text-base w-full sm:w-auto group cta-glow" onClick={() => navigate(persona.ctaPath)}>
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
            {personas.map((p, i) => (
              <button
                key={i}
                onClick={() => { setActiveIdx(i); setProgress(0); }}
                className="relative h-2 rounded-full overflow-hidden transition-all duration-300 group"
                style={{ width: i === activeIdx ? 40 : 10 }}
                aria-label={p.badge}
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
          
          <p className="text-[11px] text-muted-foreground/60 pt-1">
            ✓ Pas de carte requise · ✓ Pas d'abonnement · ✓ Prêt en 2 minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
