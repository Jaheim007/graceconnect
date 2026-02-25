import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import heroImg from '@/assets/landing-hero-new.jpg';
import { useState, useEffect } from 'react';

const personas = [
  {
    headline: 'Créez votre plateforme.\nMonétisez votre communauté.',
    sub: 'Vendez vos ressources numériques, collectez des dons et gérez votre communauté — tout en un.',
    cta: 'Créer ma plateforme',
    ctaPath: '/auth?mode=signup',
  },
  {
    headline: 'Gagnez de l\'argent\nen partageant du contenu.',
    sub: 'Zéro contenu à créer. Partagez les ressources d\'autres créateurs et touchez jusqu\'à 50% de commission.',
    cta: 'Devenir ambassadeur',
    ctaPath: '/auth?mode=signup',
  },
  {
    headline: 'Découvrez, achetez,\nsoutenez des créateurs.',
    sub: 'Accédez à des milliers de ressources numériques. Payez par Mobile Money ou carte bancaire.',
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % personas.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const persona = personas[activeIdx];

  return (
    <section className="relative pt-14 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
      </div>
      <div className="relative z-10 container max-w-5xl px-4 pt-24 pb-28 sm:pt-32 sm:pb-36">
        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} className="text-center space-y-8">
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border bg-card/50 text-muted-foreground gap-1.5">
              <Sparkles className="h-3 w-3" /> Infrastructure SaaS — Propulsé par Hacktualiz Inc.
            </Badge>
          </motion.div>

          <div className="min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={activeIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight whitespace-pre-line"
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
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              {persona.sub}
            </motion.p>
          </AnimatePresence>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" className="px-8 gap-2 h-13 text-base w-full sm:w-auto" onClick={() => navigate(persona.ctaPath)}>
              {persona.cta} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 gap-2 text-base w-full sm:w-auto" onClick={() => navigate('/about')}>
              Comment ça marche ?
            </Button>
          </motion.div>

          {/* Persona dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {personas.map((p, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === activeIdx ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
                aria-label={`Voir persona ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
