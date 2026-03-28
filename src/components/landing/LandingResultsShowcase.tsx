import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultSlide {
  image: string;
  orgName: string;
  testimonial: string;
  personName: string;
  highlight: string;
  rating: string;
  context: string;
}

const SLIDES: ResultSlide[] = [
  {
    image: '/images/results/result-1.jpg',
    orgName: 'Foi Vivante',
    testimonial: "En seulement 4 mois, j'ai vendu plus de 1 000 exemplaires de mes livres de méditation biblique. Les ambassadeurs ont fait 60% de mes ventes — je n'aurais jamais imaginé ça.",
    personName: 'Khady',
    highlight: '3 225 998 F CFA',
    rating: '9.2',
    context: '1 018 ventes · 4 mois · Livres spirituels',
  },
  {
    image: '/images/results/result-2.jpg',
    orgName: 'Divine Arts Studio',
    testimonial: "Je vends des formations en design graphique depuis 7 mois. Avec 790 clients dans 12 pays, SiteViral m'a ouvert des marchés que je ne pouvais pas atteindre seule.",
    personName: 'Wilfried E.',
    highlight: '65 892 €',
    rating: '9.5',
    context: '2 528 ventes · 7 mois · Formations design',
  },
  {
    image: '/images/results/result-3.jpg',
    orgName: 'Étoile Média',
    testimonial: "Depuis le Royaume-Uni, je vends des guides pratiques pour la diaspora africaine. En 3 mois, 291 clients ont acheté sans que j'aie besoin de publicité — tout via les ambassadeurs.",
    personName: 'Awa T.',
    highlight: '£15 478',
    rating: '8.7',
    context: '960 ventes · 3 mois · Guides diaspora',
  },
  {
    image: '/images/results/result-4.jpg',
    orgName: 'Ministère des Nations Unies en Christ',
    testimonial: "Notre église collecte les dîmes et offrandes via SiteViral depuis 11 mois. 133 dons reçus, plus de 900 ventes de nos livres de prière. La transparence financière nous a convaincu.",
    personName: 'Clarisse A.',
    highlight: '20 340 964 F CFA',
    rating: '9.8',
    context: '903 ventes · 133 dons · 11 mois · Église',
  },
  {
    image: '/images/results/result-5.jpg',
    orgName: 'Sahel Digital',
    testimonial: "Je publie des e-books en français et en anglais sur l'entrepreneuriat au Sahel. 780 clients en 6 mois grâce au programme ambassadeur. Chaque ambassadeur me rapporte en moyenne 12 ventes.",
    personName: 'Aminata C.',
    highlight: '13 221 042 FCFA',
    rating: '9.1',
    context: '1 950 ventes · 6 mois · E-books entrepreneuriat',
  },
  {
    image: '/images/results/result-6.jpg',
    orgName: 'Akademie für Digitale Bildung',
    testimonial: "Nos cours en ligne sur le marketing digital se vendent au Kenya depuis 5 mois. 1 229 transactions avec un taux de satisfaction de 94%. Le Mobile Money a tout changé pour nous.",
    personName: 'Adjoua B.',
    highlight: '5 615 301 KES',
    rating: '8.9',
    context: '1 229 ventes · 5 mois · Cours marketing',
  },
  {
    image: '/images/results/result-7.jpg',
    orgName: 'Entreprise Digitale Savane',
    testimonial: "57 produits numériques en ligne — des templates, des guides et des formations courtes. En 8 mois, plus de 1 000 ventes sans aucune publicité payante.",
    personName: 'Moussa K.',
    highlight: '3 341 641 FCFA',
    rating: '8.5',
    context: '1 000 ventes · 57 produits · 8 mois',
  },
  {
    image: '/images/results/result-8.jpg',
    orgName: 'Gemeinde der Gnade Ewige',
    testimonial: "Notre communauté religieuse utilise SiteViral pour les offrandes et la vente de nos recueils de cantiques. 23 campagnes de dons réussies en 9 mois. Nos fidèles adorent la simplicité.",
    personName: 'Nadège A.',
    highlight: '9 407 850 FCFA',
    rating: '9.3',
    context: '1 158 ventes · 23 dons · 9 mois · Église',
  },
  {
    image: '/images/results/result-9.jpg',
    orgName: 'Ministère Kehila Haïm',
    testimonial: "Depuis le Nigeria, nous vendons des études bibliques et recevons des dîmes via Mobile Money. 2 205 transactions en 10 mois. Nos pasteurs associés utilisent le programme ambassadeur.",
    personName: 'Khady D.',
    highlight: '29 833 487 NGN',
    rating: '9.6',
    context: '2 205 ventes · 10 mois · Études bibliques',
  },
  {
    image: '/images/results/result-10.jpg',
    orgName: 'Christliche Gemeinschaft',
    testimonial: "2 030 ventes et 161 dons en 1 an. Nos recueils de prière se vendent dans 8 pays africains. SiteViral est devenu l'outil principal de notre ministère pour toucher plus de vies.",
    personName: 'Wilfried E.',
    highlight: '25 623 080 FCFA',
    rating: '9.4',
    context: '2 030 ventes · 161 dons · 12 mois',
  },
];

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
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  usePreloadImages(SLIDES.map((s) => s.image));

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((p) => (p + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];
  const prevSlide = SLIDES[(current - 1 + SLIDES.length) % SLIDES.length];
  const nextSlide = SLIDES[(current + 1) % SLIDES.length];

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" id="resultats">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-[0.07] bg-primary" />

      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/5 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6 border border-primary/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
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

        {/* 3-card carousel */}
        <div className="relative h-[460px] sm:h-[520px] lg:h-[560px]">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Left preview */}
            <div className="absolute left-0 sm:left-4 lg:left-8 w-[200px] sm:w-[240px] lg:w-[280px] h-[340px] sm:h-[400px] lg:h-[440px] rounded-2xl overflow-hidden opacity-25 blur-[1px] scale-[0.88] hidden sm:block pointer-events-none">
              <img src={prevSlide.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/60" />
            </div>

            {/* Right preview */}
            <div className="absolute right-0 sm:right-4 lg:right-8 w-[200px] sm:w-[240px] lg:w-[280px] h-[340px] sm:h-[400px] lg:h-[440px] rounded-2xl overflow-hidden opacity-25 blur-[1px] scale-[0.88] hidden sm:block pointer-events-none">
              <img src={nextSlide.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/60" />
            </div>

            {/* Main card */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: dir > 0 ? 250 : -250,
                    opacity: 0,
                    scale: 0.9,
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                  },
                  exit: (dir: number) => ({
                    x: dir > 0 ? -250 : 250,
                    opacity: 0,
                    scale: 0.9,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.35 },
                }}
                className="relative w-[92%] sm:w-[55%] lg:w-[48%] max-w-[620px] rounded-2xl sm:rounded-3xl overflow-hidden z-10 bg-card border border-border shadow-xl"
              >
                {/* Image - top half */}
                <div className="relative h-[220px] sm:h-[280px] lg:h-[300px] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={`Résultats de ${slide.orgName}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                  {/* Rating badge */}
                  <motion.div
                    className="absolute top-4 left-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs font-black">{slide.rating}</span>
                    </div>
                  </motion.div>

                  {/* Revenue badge */}
                  <motion.div
                    className="absolute top-4 right-4"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    <div className="px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-md border border-border font-black text-xs text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      {slide.highlight}
                    </div>
                  </motion.div>
                </div>

                {/* Content - bottom */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-foreground leading-tight">
                      {slide.orgName}
                    </h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {slide.context}
                    </span>
                  </div>

                  <div className="relative">
                    <Quote className="absolute -top-1 -left-1 h-4 w-4 text-primary/20" />
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-4 italic">
                      {slide.testimonial}
                    </p>
                  </div>

                  <p className="text-primary text-xs font-bold">
                    — {slide.personName}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress + dots */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 max-w-xs w-full">
            <span className="text-xs text-muted-foreground font-mono tabular-nums w-5 text-right">
              {String(current + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 h-[2px] bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 6, ease: 'linear' }}
                key={current}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono tabular-nums w-5">
              {String(SLIDES.length).padStart(2, '0')}
            </span>
          </div>

          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
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
      </div>
    </section>
  );
}

export default LandingResultsShowcase;
