import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap } from 'lucide-react';

import { ResultsShowcaseCard } from '@/components/landing/ResultsShowcaseCard';
import { RESULT_SLIDES } from '@/components/landing/resultsShowcaseData';

// Preload all images on mount
function usePreloadImages(images: string[]) {
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
}

export function LandingResultsShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const duplicatedSlides = [...RESULT_SLIDES, ...RESULT_SLIDES];

  usePreloadImages(RESULT_SLIDES.map((slide) => slide.image));

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" id="resultats">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/5 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6 border border-primary/10">
            <Zap className="h-4 w-4 text-primary shrink-0" />
            Résultats vérifiés
          </motion.span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Nos derniers{' '}
            <span className="text-primary">résultats</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-sm sm:text-base">
            Des communautés et entreprises qui grandissent chaque jour sur SiteViral.
          </p>
        </motion.div>

        <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden py-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background via-background/90 to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background via-background/90 to-transparent sm:w-28" />

          <motion.div
            className="flex w-max gap-5 px-4 sm:gap-6 sm:px-6 lg:px-10"
            animate={shouldReduceMotion ? { x: 0 } : { x: ['0%', '-50%'] }}
            transition={shouldReduceMotion ? undefined : { duration: 55, ease: 'linear', repeat: Infinity }}
            style={{ willChange: 'transform' }}
          >
            {duplicatedSlides.map((slide, index) => (
              <ResultsShowcaseCard
                key={`${slide.orgName}-${index}`}
                slide={slide}
                priority={index < 4}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default LandingResultsShowcase;
