import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { convertCurrency } from '@/lib/currencyConvert';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/** Price anchors per currency for the simulator slider */
const CURRENCY_RANGES: Record<string, { min: number; max: number; step: number; default: number }> = {
  USD: { min: 1, max: 50, step: 1, default: 10 },
  EUR: { min: 1, max: 50, step: 1, default: 10 },
  GBP: { min: 1, max: 40, step: 1, default: 8 },
  XOF: { min: 500, max: 50000, step: 500, default: 5000 },
  XAF: { min: 500, max: 50000, step: 500, default: 5000 },
  NGN: { min: 500, max: 50000, step: 500, default: 5000 },
  GHS: { min: 5, max: 500, step: 5, default: 50 },
  KES: { min: 100, max: 10000, step: 100, default: 1000 },
  ZAR: { min: 10, max: 1000, step: 10, default: 100 },
  MAD: { min: 10, max: 500, step: 10, default: 50 },
  TND: { min: 3, max: 150, step: 3, default: 15 },
};

export function LandingPricingSimple() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currency, fmt } = useDisplayCurrency();

  const range = CURRENCY_RANGES[currency] || CURRENCY_RANGES.USD;
  const [price, setPrice] = useState(range.default);
  const [commission, setCommission] = useState(20);

  // Reset price when currency changes to stay within valid range
  const effectivePrice = Math.max(range.min, Math.min(price, range.max));

  const platformFee = Math.round(effectivePrice * 0.10);
  const ambassadorFee = Math.round(effectivePrice * commission / 100);
  const creatorEarns = effectivePrice - platformFee - ambassadorFee;

  const features = isFr ? [
    'IA pour écrire ton livre',
    'Boutique en ligne complète',
    'Programme ambassadeur intégré',
    'Mobile Money & Carte bancaire',
    'Watermark & protection 8 couches',
    'Prévisualisation PDF sécurisée',
    'Collecte de dons & offrandes',
    'Tableau de bord analytique',
  ] : [
    'AI to write your book',
    'Complete online store',
    'Built-in ambassador program',
    'Mobile Money & Credit card',
    'Watermark & 8-layer protection',
    'Secure PDF preview',
    'Donation & offering collection',
    'Analytics dashboard',
  ];

  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30 scroll-mt-16">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            {isFr ? (
              <>Gratuit. SiteViral prend <span className="text-primary">10%</span>. C'est tout.</>
            ) : (
              <>Free. SiteViral takes <span className="text-primary">10%</span>. That's it.</>
            )}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isFr
              ? "Pas d'abonnement. Pas de frais cachés. On ne gagne que quand tu gagnes."
              : "No subscription. No hidden fees. We only earn when you earn."}
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="relative rounded-3xl border-2 border-primary bg-card overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <div className="p-8 sm:p-10">
              {/* Price simulator */}
              <div className="mb-8 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-accent" />
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {isFr ? 'Simulateur de revenus' : 'Revenue simulator'}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isFr ? 'Prix de ton livre' : 'Your book price'}: <span className="text-primary font-bold">{fmt(effectivePrice)}</span>
                  </label>
                  <Slider value={[effectivePrice]} onValueChange={([v]) => setPrice(v)} min={range.min} max={range.max} step={range.step} className="w-full" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isFr ? 'Commission ambassadeur' : 'Ambassador commission'}: <span className="text-emerald-500 font-bold">{commission}%</span>
                  </label>
                  <Slider value={[commission]} onValueChange={([v]) => setCommission(v)} min={5} max={50} step={5} className="w-full" />
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-3 bg-muted/50 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-primary">{fmt(creatorEarns)}</p>
                    <p className="text-[10px] text-muted-foreground">{isFr ? 'Tu gardes' : 'You keep'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-emerald-500">{fmt(ambassadorFee)}</p>
                    <p className="text-[10px] text-muted-foreground">{isFr ? 'Ambassadeur gagne' : 'Ambassador earns'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-muted-foreground">{fmt(platformFee)}</p>
                    <p className="text-[10px] text-muted-foreground">SiteViral (10%)</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  💡 10 {isFr ? 'ambassadeurs' : 'ambassadors'} × 5 {isFr ? 'ventes chacun' : 'sales each'} = <strong className="text-foreground">{fmt(creatorEarns * 50)}</strong> {isFr ? 'pour toi' : 'for you'}
                </p>
              </div>

              {/* Features */}
              <div className="border-t border-border pt-6">
                <p className="text-sm font-bold mb-3">{isFr ? 'Tout est inclus :' : 'Everything included:'}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {features.map((b) => (
                    <div key={b} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button size="lg" className="gap-2 h-13 px-8 text-base group" onClick={() => navigate('/auth?mode=signup')}>
                  {isFr ? 'Commencer gratuitement' : 'Start for free'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {(isFr
                  ? ['Pas de carte requise', "Pas d'engagement", 'Pas de frais cachés']
                  : ['No card required', 'No commitment', 'No hidden fees']
                ).map((t) => (
                  <span key={t} className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-3 py-1 border border-border">
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
