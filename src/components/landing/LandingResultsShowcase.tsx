import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, Heart, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultSlide {
  orgName: string;
  orgType: 'church' | 'enterprise';
  revenue: string;
  currency: string;
  transactions: number;
  donations: number;
  customers: number;
  products: number;
  testimonial: string;
  personName: string;
}

const RESULTS: ResultSlide[] = [
  {
    orgName: 'Ministère des Nations Unies en Christ',
    orgType: 'church',
    revenue: '20 340 964',
    currency: 'F CFA',
    transactions: 903,
    donations: 133,
    customers: 301,
    products: 37,
    testimonial: 'Grâce à SiteViral, notre communauté a pu digitaliser ses dons et vendre ses contenus spirituels. En quelques mois, nous avons atteint plus de 20 millions de revenus avec 903 transactions !',
    personName: 'Clarisse A.',
  },
  {
    orgName: 'Communauté Charismatique Eben-Haézer Marcory',
    orgType: 'church',
    revenue: '10 155 996',
    currency: 'FCFA',
    transactions: 722,
    donations: 129,
    customers: 190,
    products: 49,
    testimonial: 'Nos 129 dons reçus et 722 ventes prouvent que la plateforme fonctionne. SiteViral a transformé la manière dont notre communauté partage et soutient nos projets.',
    personName: 'Mamadou K.',
  },
  {
    orgName: 'Sahel Digital',
    orgType: 'enterprise',
    revenue: '13 221 042',
    currency: 'FCFA',
    transactions: 1950,
    donations: 3,
    customers: 780,
    products: 28,
    testimonial: 'Avec près de 2 000 transactions et 780 clients, notre entreprise a trouvé le canal de vente idéal. 13 millions FCFA de chiffre d\'affaires, et ça continue de croître.',
    personName: 'Aminata C.',
  },
  {
    orgName: 'Christliche Gemeinschaft Lebendiges Wort',
    orgType: 'church',
    revenue: '25 623 080',
    currency: 'FCFA',
    transactions: 2030,
    donations: 161,
    customers: 383,
    products: 72,
    testimonial: 'Plus de 25 millions FCFA collectés, 161 dons reçus et 2 030 ventes. SiteViral nous a permis de toucher notre audience bien au-delà de nos murs.',
    personName: 'Wilfried E.',
  },
  {
    orgName: 'Ministère Kehila Haïm de Ouagadougou',
    orgType: 'church',
    revenue: '29 833 487',
    currency: 'NGN',
    transactions: 2205,
    donations: 148,
    customers: 735,
    products: 49,
    testimonial: 'Près de 30 millions NGN de revenus avec 148 dons et 2 205 transactions. La plateforme nous a ouvert des portes qu\'on n\'imaginait même pas.',
    personName: 'Khady D.',
  },
  {
    orgName: 'Entreprise Digitale Savane-Kerntech',
    orgType: 'enterprise',
    revenue: '3 341 641',
    currency: 'FCFA',
    transactions: 1000,
    donations: 1,
    customers: 196,
    products: 57,
    testimonial: 'Avec 57 produits numériques et 1 000 ventes, SiteViral est devenu notre principal outil de distribution. Simple, efficace, et les paiements Mobile Money marchent parfaitement.',
    personName: 'Awa T.',
  },
  {
    orgName: 'Evangelische Freikirche Lumière Afrique',
    orgType: 'church',
    revenue: '14 137 883',
    currency: 'F CFA',
    transactions: 659,
    donations: 21,
    customers: 439,
    products: 18,
    testimonial: 'Même avec seulement 18 produits, nous avons généré plus de 14 millions F CFA. La force des ambassadeurs est incroyable pour faire connaître nos ressources.',
    personName: 'Rama G.',
  },
  {
    orgName: 'Kirchengemeinde Hoffnung Kinshasa',
    orgType: 'church',
    revenue: '14 411 924',
    currency: 'FCFA',
    transactions: 1790,
    donations: 99,
    customers: 459,
    products: 64,
    testimonial: '99 dons, 1 790 ventes, 459 membres actifs. SiteViral a donné une nouvelle dimension à notre mission avec plus de 14 millions FCFA de revenus.',
    personName: 'Wilfried E.',
  },
];

function formatNum(n: number) {
  return n.toLocaleString('fr-FR');
}

export function LandingResultsShowcase() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(p => (p + 1) % RESULTS.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(p => (p - 1 + RESULTS.length) % RESULTS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = RESULTS[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 to-background" id="resultats">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
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

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg min-h-[340px] sm:min-h-[300px]">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="p-6 sm:p-10"
              >
                {/* Org header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    'h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0',
                    slide.orgType === 'church'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent/20 text-accent-foreground'
                  )}>
                    {slide.orgType === 'church' ? '⛪' : '🏢'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">{slide.orgName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {slide.orgType === 'church' ? 'Communauté' : 'Entreprise'} · {slide.personName}
                    </p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-sm sm:text-base font-extrabold text-emerald-600">{slide.revenue}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{slide.currency} de revenus</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                    <ShoppingBag className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-sm sm:text-base font-extrabold text-primary">{formatNum(slide.transactions)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Transactions</p>
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 text-center">
                    <Heart className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                    <p className="text-sm sm:text-base font-extrabold text-orange-600">{formatNum(slide.donations)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Dons reçus</p>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-center">
                    <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm sm:text-base font-extrabold text-blue-600">{formatNum(slide.customers)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Clients</p>
                  </div>
                </div>

                {/* Testimonial quote */}
                <div className="relative bg-muted/40 rounded-xl p-4 sm:p-5">
                  <Quote className="h-5 w-5 text-primary/20 absolute top-3 left-3" />
                  <p className="text-sm text-muted-foreground leading-relaxed italic pl-6">
                    "{slide.testimonial}"
                  </p>
                  <p className="text-xs font-semibold mt-2 pl-6">— {slide.personName}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {RESULTS.map((_, i) => (
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
