import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Quote, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultSlide {
  image: string;
  orgName: string;
  testimonial: string;
  personName: string;
  highlight: string;
}

const SLIDES: ResultSlide[] = [
  {
    image: '/images/results/result-1.jpg',
    orgName: 'Foi Vivante',
    testimonial: 'Plus de 3 millions F CFA de revenus et 1 018 ventes réalisées. SiteViral a changé notre manière de distribuer nos contenus spirituels.',
    personName: 'Khady',
    highlight: '3 225 998 F CFA',
  },
  {
    image: '/images/results/result-2.jpg',
    orgName: 'Divine Arts Studio',
    testimonial: '65 892 € de chiffre d\'affaires avec 2 528 transactions et 790 clients. La plateforme nous a ouvert le marché européen.',
    personName: 'Wilfried E.',
    highlight: '65 892 €',
  },
  {
    image: '/images/results/result-3.jpg',
    orgName: 'Étoile Média',
    testimonial: '£15 478 de revenus, 960 ventes et 291 clients au Royaume-Uni. Simple, rapide, et les paiements arrivent sans souci.',
    personName: 'Awa T.',
    highlight: '£15 478',
  },
  {
    image: '/images/results/result-4.jpg',
    orgName: 'Ministère des Nations Unies en Christ',
    testimonial: '20 340 964 F CFA de revenus, 903 ventes et 133 dons reçus. Notre communauté a trouvé le canal idéal.',
    personName: 'Clarisse A.',
    highlight: '20 340 964 F CFA',
  },
  {
    image: '/images/results/result-5.jpg',
    orgName: 'Sahel Digital',
    testimonial: '13 221 042 FCFA générés avec 1 950 transactions et 780 clients. SiteViral est devenu notre outil principal.',
    personName: 'Aminata C.',
    highlight: '13 221 042 FCFA',
  },
  {
    image: '/images/results/result-6.jpg',
    orgName: 'Akademie für Digitale Bildung Afrique',
    testimonial: '5 615 301 KES de revenus avec 1 229 transactions. Les ambassadeurs boostent vraiment nos ventes.',
    personName: 'Adjoua B.',
    highlight: '5 615 301 KES',
  },
  {
    image: '/images/results/result-7.jpg',
    orgName: 'Entreprise Digitale Savane-Kerntech',
    testimonial: '3 341 641 FCFA et 1 000 ventes réalisées avec 57 produits. Le Mobile Money fonctionne parfaitement.',
    personName: 'Awa T.',
    highlight: '3 341 641 FCFA',
  },
  {
    image: '/images/results/result-8.jpg',
    orgName: 'Gemeinde der Gnade Ewige Brazzaville',
    testimonial: '9 407 850 FCFA collectés, 1 158 transactions et 23 dons. La force des ambassadeurs est incroyable.',
    personName: 'Nadège A.',
    highlight: '9 407 850 FCFA',
  },
  {
    image: '/images/results/result-9.jpg',
    orgName: 'Ministère Kehila Haïm de Ouagadougou',
    testimonial: 'Près de 30 millions NGN de revenus avec 2 205 transactions et 148 dons reçus.',
    personName: 'Khady D.',
    highlight: '29 833 487 NGN',
  },
  {
    image: '/images/results/result-10.jpg',
    orgName: 'Christliche Gemeinschaft Lebendiges Wort',
    testimonial: '25 623 080 FCFA, 2 030 ventes et 161 dons. SiteViral nous a permis de toucher notre audience.',
    personName: 'Wilfried E.',
    highlight: '25 623 080 FCFA',
  },
];

function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 pointer-events-none"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ y: '110%', opacity: 0 }}
      animate={{ y: '-10%', opacity: [0, 0.5, 0] }}
      transition={{ duration: 8 + Math.random() * 4, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}

export function LandingResultsShowcase() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(p => (p + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i, delay: i * 0.8, x: Math.random() * 100, size: 3 + Math.random() * 5,
    })), []);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" id="resultats">
      {/* Animated bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/20">
        {particles.map(p => <FloatingParticle key={p.id} {...p} />)}
      </div>

      {/* Glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.12), transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-5 border border-primary/20"
            animate={{ boxShadow: ['0 0 0px hsl(var(--primary) / 0)', '0 0 20px hsl(var(--primary) / 0.15)', '0 0 0px hsl(var(--primary) / 0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Résultats vérifiés
          </motion.span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Nos derniers résultats
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-sm sm:text-base">
            Des communautés et entreprises qui grandissent chaque jour sur SiteViral.
          </p>
        </motion.div>

        {/* Continuous sliding carousel */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              {/* Screenshot with overlay gradient */}
              <div className="relative border border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-card">
                <motion.img
                  src={slide.image}
                  alt={`Résultats de ${slide.orgName}`}
                  className="w-full h-auto"
                  loading="lazy"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 5, ease: 'easeOut' }}
                />

                {/* Revenue floating badge */}
                <motion.div
                  className="absolute top-4 right-4 sm:top-6 sm:right-6"
                  initial={{ y: -40, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 12 }}
                >
                  <motion.div
                    className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 backdrop-blur-sm"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {slide.highlight}
                  </motion.div>
                </motion.div>

                {/* Bottom testimonial overlay */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/95 to-transparent pt-12 pb-5 px-5 sm:px-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className="shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"
                      initial={{ rotate: -90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                    >
                      <Quote className="h-4 w-4 text-primary" />
                    </motion.div>
                    <div className="flex-1">
                      <motion.p
                        className="text-sm sm:text-base text-foreground/80 italic leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        "{slide.testimonial}"
                      </motion.p>
                      <motion.p
                        className="text-xs sm:text-sm font-bold text-primary mt-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        — {slide.personName}, {slide.orgName}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Animated progress bar */}
        <div className="mt-8 flex items-center gap-3 max-w-md mx-auto">
          <span className="text-xs text-muted-foreground font-mono tabular-nums w-5 text-right">
            {String(current + 1).padStart(2, '0')}
          </span>
          <div className="flex-1 h-1 bg-border/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              key={current}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono tabular-nums w-5">
            {String(SLIDES.length).padStart(2, '0')}
          </span>
        </div>

        {/* Mini thumbnails */}
        <div className="flex justify-center gap-2 mt-4">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === current
                  ? 'w-8 bg-primary'
                  : 'w-1.5 bg-border hover:bg-muted-foreground/40'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingResultsShowcase;
