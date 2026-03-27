import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultSlide {
  image: string;
  orgName: string;
  testimonial: string;
  personName: string;
}

const SLIDES: ResultSlide[] = [
  {
    image: '/images/results/result-1.jpg',
    orgName: 'Foi Vivante',
    testimonial: 'Plus de 3 millions F CFA de revenus et 1 018 ventes réalisées. SiteViral a changé notre manière de distribuer nos contenus spirituels.',
    personName: 'Khady',
  },
  {
    image: '/images/results/result-2.jpg',
    orgName: 'Divine Arts Studio',
    testimonial: '65 892 € de chiffre d\'affaires avec 2 528 transactions et 790 clients. La plateforme nous a ouvert le marché européen.',
    personName: 'Wilfried E.',
  },
  {
    image: '/images/results/result-3.jpg',
    orgName: 'Étoile Média',
    testimonial: '£15 478 de revenus, 960 ventes et 291 clients au Royaume-Uni. Simple, rapide, et les paiements arrivent sans souci.',
    personName: 'Awa T.',
  },
  {
    image: '/images/results/result-4.jpg',
    orgName: 'Ministère des Nations Unies en Christ',
    testimonial: '20 340 964 F CFA de revenus, 903 ventes et 133 dons reçus. Notre communauté a trouvé le canal idéal pour soutenir notre mission.',
    personName: 'Clarisse A.',
  },
  {
    image: '/images/results/result-5.jpg',
    orgName: 'Sahel Digital',
    testimonial: '13 221 042 FCFA générés avec 1 950 transactions et 780 clients. SiteViral est devenu notre outil principal de vente.',
    personName: 'Aminata C.',
  },
  {
    image: '/images/results/result-6.jpg',
    orgName: 'Akademie für Digitale Bildung Afrique',
    testimonial: '5 615 301 KES de revenus avec 1 229 transactions. Les commissions d\'ambassadeurs boostent vraiment nos ventes.',
    personName: 'Adjoua B.',
  },
  {
    image: '/images/results/result-7.jpg',
    orgName: 'Entreprise Digitale Savane-Kerntech',
    testimonial: '3 341 641 FCFA et 1 000 ventes réalisées avec 57 produits. Le Mobile Money fonctionne parfaitement.',
    personName: 'Awa T.',
  },
  {
    image: '/images/results/result-8.jpg',
    orgName: 'Gemeinde der Gnade Ewige Brazzaville',
    testimonial: '9 407 850 FCFA collectés, 1 158 transactions et 23 dons. La force des ambassadeurs est incroyable.',
    personName: 'Nadège A.',
  },
  {
    image: '/images/results/result-9.jpg',
    orgName: 'Ministère Kehila Haïm de Ouagadougou',
    testimonial: 'Près de 30 millions NGN de revenus avec 2 205 transactions et 148 dons reçus. Des résultats au-delà de nos attentes.',
    personName: 'Khady D.',
  },
  {
    image: '/images/results/result-10.jpg',
    orgName: 'Christliche Gemeinschaft Lebendiges Wort',
    testimonial: '25 623 080 FCFA, 2 030 ventes et 161 dons. SiteViral nous a permis de toucher notre audience bien au-delà de nos murs.',
    personName: 'Wilfried E.',
  },
];

export function LandingResultsShowcase() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(p => (p + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(p => (p - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -400 : 400, opacity: 0 }),
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 to-background" id="resultats">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Résultats vérifiés
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Nos derniers résultats
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Des communautés et entreprises qui grandissent chaque jour sur SiteViral.
          </p>
        </div>

        {/* Slideshow */}
        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-6 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-6 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                {/* Screenshot image */}
                <div className="w-full">
                  <img
                    src={slide.image}
                    alt={`Résultats de ${slide.orgName} sur SiteViral`}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>

                {/* Testimonial bar */}
                <div className="p-4 sm:p-6 border-t border-border bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Quote className="h-5 w-5 text-primary/30 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{slide.testimonial}"
                      </p>
                      <p className="text-xs font-bold mt-2">— {slide.personName}, {slide.orgName}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === current ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/30'
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingResultsShowcase;
