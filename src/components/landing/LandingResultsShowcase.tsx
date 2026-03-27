import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { TrendingUp, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultSlide {
  image: string;
  orgName: string;
  testimonial: string;
  personName: string;
  highlight: string;
  rating: string;
}

const SLIDES: ResultSlide[] = [
  {
    image: '/images/results/result-1.jpg',
    orgName: 'Foi Vivante',
    testimonial: 'Plus de 3 millions F CFA de revenus et 1 018 ventes réalisées. SiteViral a changé notre manière de distribuer nos contenus spirituels.',
    personName: 'Khady',
    highlight: '3 225 998 F CFA',
    rating: '9.2',
  },
  {
    image: '/images/results/result-2.jpg',
    orgName: 'Divine Arts Studio',
    testimonial: '65 892 € de chiffre d\'affaires avec 2 528 transactions et 790 clients.',
    personName: 'Wilfried E.',
    highlight: '65 892 €',
    rating: '9.5',
  },
  {
    image: '/images/results/result-3.jpg',
    orgName: 'Étoile Média',
    testimonial: '£15 478 de revenus, 960 ventes et 291 clients au Royaume-Uni.',
    personName: 'Awa T.',
    highlight: '£15 478',
    rating: '8.7',
  },
  {
    image: '/images/results/result-4.jpg',
    orgName: 'Ministère des Nations Unies en Christ',
    testimonial: '20 340 964 F CFA de revenus, 903 ventes et 133 dons reçus.',
    personName: 'Clarisse A.',
    highlight: '20 340 964 F CFA',
    rating: '9.8',
  },
  {
    image: '/images/results/result-5.jpg',
    orgName: 'Sahel Digital',
    testimonial: '13 221 042 FCFA générés avec 1 950 transactions et 780 clients.',
    personName: 'Aminata C.',
    highlight: '13 221 042 FCFA',
    rating: '9.1',
  },
  {
    image: '/images/results/result-6.jpg',
    orgName: 'Akademie für Digitale Bildung',
    testimonial: '5 615 301 KES de revenus avec 1 229 transactions.',
    personName: 'Adjoua B.',
    highlight: '5 615 301 KES',
    rating: '8.9',
  },
  {
    image: '/images/results/result-7.jpg',
    orgName: 'Entreprise Digitale Savane',
    testimonial: '3 341 641 FCFA et 1 000 ventes réalisées avec 57 produits.',
    personName: 'Awa T.',
    highlight: '3 341 641 FCFA',
    rating: '8.5',
  },
  {
    image: '/images/results/result-8.jpg',
    orgName: 'Gemeinde der Gnade Ewige',
    testimonial: '9 407 850 FCFA collectés, 1 158 transactions et 23 dons.',
    personName: 'Nadège A.',
    highlight: '9 407 850 FCFA',
    rating: '9.3',
  },
  {
    image: '/images/results/result-9.jpg',
    orgName: 'Ministère Kehila Haïm',
    testimonial: 'Près de 30 millions NGN de revenus avec 2 205 transactions.',
    personName: 'Khady D.',
    highlight: '29 833 487 NGN',
    rating: '9.6',
  },
  {
    image: '/images/results/result-10.jpg',
    orgName: 'Christliche Gemeinschaft',
    testimonial: '25 623 080 FCFA, 2 030 ventes et 161 dons.',
    personName: 'Wilfried E.',
    highlight: '25 623 080 FCFA',
    rating: '9.4',
  },
];

export function LandingResultsShowcase() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(p => (p + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];
  const prevSlide = SLIDES[(current - 1 + SLIDES.length) % SLIDES.length];
  const nextSlide = SLIDES[(current + 1) % SLIDES.length];

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden bg-[#0a0a0f]" id="resultats">
      {/* Cinematic gradient bg */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#111128] to-[#0a0a0f]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] opacity-20 bg-primary" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 bg-purple-500" />
      </div>

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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6 border border-white/10 backdrop-blur-sm"
            animate={{ boxShadow: ['0 0 0px hsl(var(--primary) / 0)', '0 0 30px hsl(var(--primary) / 0.2)', '0 0 0px hsl(var(--primary) / 0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Résultats vérifiés
          </motion.span>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Nos derniers{' '}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
              résultats
            </span>
          </h2>
          <p className="text-white/40 mt-4 max-w-2xl mx-auto text-sm sm:text-base">
            Des communautés et entreprises qui grandissent chaque jour sur SiteViral.
          </p>
        </motion.div>

        {/* Netflix-style 3-card carousel */}
        <div className="relative h-[420px] sm:h-[520px] lg:h-[580px]">
          {/* Side cards (blurred, smaller) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Left preview */}
            <motion.div
              className="absolute left-0 sm:left-4 lg:left-8 w-[180px] sm:w-[240px] lg:w-[300px] h-[300px] sm:h-[400px] lg:h-[460px] rounded-2xl overflow-hidden opacity-30 blur-[2px] scale-90 hidden sm:block"
              initial={false}
              animate={{ x: 0, opacity: 0.3 }}
            >
              <img src={prevSlide.image} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/60" />
            </motion.div>

            {/* Right preview */}
            <motion.div
              className="absolute right-0 sm:right-4 lg:right-8 w-[180px] sm:w-[240px] lg:w-[300px] h-[300px] sm:h-[400px] lg:h-[460px] rounded-2xl overflow-hidden opacity-30 blur-[2px] scale-90 hidden sm:block"
              initial={false}
              animate={{ x: 0, opacity: 0.3 }}
            >
              <img src={nextSlide.image} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/60" />
            </motion.div>

            {/* Main card */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
              variants={{
                  enter: (dir: number) => ({
                    x: dir > 0 ? 300 : -300,
                    opacity: 0,
                    scale: 0.85,
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                  },
                  exit: (dir: number) => ({
                    x: dir > 0 ? -300 : 300,
                    opacity: 0,
                    scale: 0.85,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.4 },
                }}
                className="relative w-[90%] sm:w-[55%] lg:w-[50%] max-w-[640px] h-[380px] sm:h-[470px] lg:h-[530px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl z-10"
                style={{
                  boxShadow: '0 25px 100px -12px rgba(0, 0, 0, 0.8), 0 0 60px -15px hsl(var(--primary) / 0.3)',
                }}
              >
                {/* Image */}
                <motion.img
                  src={slide.image}
                  alt={`Résultats de ${slide.orgName}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 6, ease: 'easeOut' }}
                />

                {/* Dark cinematic overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

                {/* Rating badge (Netflix style) */}
                <motion.div
                  className="absolute top-4 left-4 sm:top-6 sm:left-6"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/90 backdrop-blur-sm">
                    <Star className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground" />
                    <span className="text-sm font-black text-primary-foreground">{slide.rating}</span>
                  </div>
                </motion.div>

                {/* Revenue badge */}
                <motion.div
                  className="absolute top-4 right-4 sm:top-6 sm:right-6"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <motion.div
                    className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 font-black text-xs sm:text-sm text-white flex items-center gap-2"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    {slide.highlight}
                  </motion.div>
                </motion.div>

                {/* Bottom info */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-5 sm:p-8"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <motion.h3
                    className="text-lg sm:text-2xl font-black text-white mb-2 leading-tight"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {slide.orgName}
                  </motion.h3>
                  <motion.p
                    className="text-white/60 text-xs sm:text-sm leading-relaxed line-clamp-2 max-w-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    "{slide.testimonial}"
                  </motion.p>
                  <motion.p
                    className="text-primary text-xs font-bold mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    — {slide.personName}
                  </motion.p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress + dots */}
        <div className="mt-10 flex flex-col items-center gap-4">
          {/* Animated progress bar */}
          <div className="flex items-center gap-3 max-w-sm w-full">
            <span className="text-xs text-white/30 font-mono tabular-nums w-5 text-right">
              {String(current + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                key={current}
              />
            </div>
            <span className="text-xs text-white/30 font-mono tabular-nums w-5">
              {String(SLIDES.length).padStart(2, '0')}
            </span>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  i === current
                    ? 'w-8 bg-gradient-to-r from-primary to-purple-400'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
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
