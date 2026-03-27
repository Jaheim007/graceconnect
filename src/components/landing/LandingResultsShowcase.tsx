import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronLeft, ChevronRight, Quote, Sparkles } from 'lucide-react';
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
    testimonial: '20 340 964 F CFA de revenus, 903 ventes et 133 dons reçus. Notre communauté a trouvé le canal idéal pour soutenir notre mission.',
    personName: 'Clarisse A.',
    highlight: '20 340 964 F CFA',
  },
  {
    image: '/images/results/result-5.jpg',
    orgName: 'Sahel Digital',
    testimonial: '13 221 042 FCFA générés avec 1 950 transactions et 780 clients. SiteViral est devenu notre outil principal de vente.',
    personName: 'Aminata C.',
    highlight: '13 221 042 FCFA',
  },
  {
    image: '/images/results/result-6.jpg',
    orgName: 'Akademie für Digitale Bildung Afrique',
    testimonial: '5 615 301 KES de revenus avec 1 229 transactions. Les commissions d\'ambassadeurs boostent vraiment nos ventes.',
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
    testimonial: 'Près de 30 millions NGN de revenus avec 2 205 transactions et 148 dons reçus. Des résultats au-delà de nos attentes.',
    personName: 'Khady D.',
    highlight: '29 833 487 NGN',
  },
  {
    image: '/images/results/result-10.jpg',
    orgName: 'Christliche Gemeinschaft Lebendiges Wort',
    testimonial: '25 623 080 FCFA, 2 030 ventes et 161 dons. SiteViral nous a permis de toucher notre audience bien au-delà de nos murs.',
    personName: 'Wilfried E.',
    highlight: '25 623 080 FCFA',
  },
];

/* Floating particle component */
function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 pointer-events-none"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ y: '110%', opacity: 0 }}
      animate={{
        y: '-10%',
        opacity: [0, 0.6, 0.3, 0],
        x: [0, (Math.random() - 0.5) * 60],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

export function LandingResultsShowcase() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(p => (p + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(p => (p - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isHovered]);

  const slide = SLIDES[current];

  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      delay: i * 0.7,
      x: Math.random() * 100,
      size: 3 + Math.random() * 5,
    })), []);

  return (
    <section
      className="relative py-20 sm:py-28 overflow-hidden"
      id="resultats"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"
          animate={{
            background: [
              'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--background)), hsl(var(--accent) / 0.05))',
              'linear-gradient(225deg, hsl(var(--accent) / 0.08), hsl(var(--background)), hsl(var(--primary) / 0.03))',
              'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--background)), hsl(var(--accent) / 0.05))',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Floating particles */}
        {particles.map(p => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Header with entrance animation */}
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
            <Sparkles className="h-3.5 w-3.5" />
          </motion.span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
            Nos derniers résultats
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-sm sm:text-base">
            Des communautés et entreprises africaines qui grandissent chaque jour sur SiteViral.
          </p>
        </motion.div>

        {/* Main slideshow container */}
        <div className="relative">
          {/* Glow behind card */}
          <motion.div
            className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.3), transparent 70%)' }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Navigation arrows */}
          <motion.button
            onClick={prev}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-7 z-20 h-12 w-12 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={next}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-7 z-20 h-12 w-12 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>

          {/* Card */}
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-card shadow-2xl relative">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                initial={(dir: number) => ({
                  x: dir > 0 ? '100%' : '-100%',
                  opacity: 0,
                  scale: 0.88,
                  rotateY: dir > 0 ? 12 : -12,
                })}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  rotateY: 0,
                }}
                exit={(dir: number) => ({
                  x: dir > 0 ? '-100%' : '100%',
                  opacity: 0,
                  scale: 0.88,
                  rotateY: dir > 0 ? -12 : 12,
                })}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ perspective: 1200 }}
              >
                {/* Screenshot */}
                <div className="relative w-full overflow-hidden">
                  <motion.img
                    src={slide.image}
                    alt={`Résultats de ${slide.orgName} sur SiteViral`}
                    className="w-full h-auto"
                    loading="lazy"
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  {/* Revenue badge overlay */}
                  <motion.div
                    className="absolute top-4 right-4 sm:top-6 sm:right-6"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  >
                    <div className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow-lg flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {slide.highlight}
                    </div>
                  </motion.div>
                </div>

                {/* Testimonial bar */}
                <motion.div
                  className="p-5 sm:p-7 border-t border-border/60 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="shrink-0 mt-1">
                      <motion.div
                        className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Quote className="h-4 w-4 text-primary" />
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed italic">
                        "{slide.testimonial}"
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                        <p className="text-xs sm:text-sm font-bold text-primary shrink-0">
                          — {slide.personName}, {slide.orgName}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots + counter */}
          <div className="flex items-center justify-center gap-3 mt-7">
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {String(current + 1).padStart(2, '0')}
            </span>
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className="relative h-2 overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: i === current ? 32 : 8 }}
                  aria-label={`Slide ${i + 1}`}
                >
                  <div className={cn(
                    'absolute inset-0 rounded-full transition-colors',
                    i === current ? 'bg-primary/30' : 'bg-border'
                  )} />
                  {i === current && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary"
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: isHovered ? 99999 : 5, ease: 'linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {String(SLIDES.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingResultsShowcase;
