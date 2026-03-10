import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Building2, ShoppingBag, Users, BarChart3, Shield, Wallet, Heart, Zap, CheckCircle, BookOpen, Headphones, Video, FileText, Palette } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

const PRODUCT_TYPES = [
  { icon: BookOpen, label: 'eBook / PDF', emoji: '📖' },
  { icon: Headphones, label: 'Audio', emoji: '🎧' },
  { icon: Video, label: 'Vidéo / Cours', emoji: '🎬' },
  { icon: FileText, label: 'Templates', emoji: '📄' },
  { icon: Palette, label: 'Design / Art', emoji: '🎨' },
  { icon: Heart, label: 'Dons / Campagne', emoji: '❤️' },
];

const PLATFORM_PERKS = [
  { icon: ShoppingBag, label: 'Boutique digitale avec paiement Mobile Money & carte' },
  { icon: Users, label: 'Armée d\'ambassadeurs qui vendent pour toi (5-50% commission)' },
  { icon: BarChart3, label: 'Analytics avancés : ventes, clics, CRM, tout en temps réel' },
  { icon: Shield, label: 'Vérification d\'identité intégrée & protection anti-fraude 8 couches' },
  { icon: Wallet, label: 'Retraits Mobile Money & virement — sans minimum bloquant' },
  { icon: Heart, label: 'Campagnes de dons et collectes intégrées' },
];

export default function VendreLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=landing, 1=simulator

  const handleStart = () => {
    if (user) {
      navigate('/create-org');
    } else {
      navigate('/auth?intent=creator&redirect=/create-org');
    }
  };

  return (
    <AdaptiveLayout>
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Vendez vos produits digitaux — Siteviral"
        description="Créez votre centre digital, vendez eBooks, cours, vidéos et activez une armée d'ambassadeurs qui vendent pour vous. Mobile Money & carte."
        canonicalUrl="https://siteviral.com/vendre"
      />

      {/* Hero */}
      <section className="pt-24 pb-12 px-4">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="secondary" className="mb-6 text-xs gap-1.5 px-3 py-1.5">
              <Building2 className="h-3.5 w-3.5" /> Espace Créateur
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] mb-4">
              Vends plus grâce à<br />
              <span className="text-primary">tes ambassadeurs.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-8">
              Crée ton centre digital en 5 minutes. Tes ambassadeurs partagent, tu encaisses. Mobile Money & carte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-sm" onClick={handleStart}>
                🏢 Créer mon centre digital <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-sm" onClick={() => setStep(1)}>
                💰 Simuler mes revenus
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Gratuit pour démarrer · Première vente en 10 min</p>
          </motion.div>
        </div>
      </section>

      {/* Revenue Simulator Modal */}
      <AnimatePresence>
        {step === 1 && <RevenueSimulator onClose={() => setStep(0)} onStart={handleStart} />}
      </AnimatePresence>

      {/* What you sell */}
      <section className="py-12 px-4 border-y border-border bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-lg font-extrabold text-center mb-6">Que veux-tu vendre ?</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {PRODUCT_TYPES.map(p => (
              <motion.button
                key={p.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-[10px] font-medium text-muted-foreground">{p.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Perks grid */}
      <section className="py-16 px-4">
        <div className="container max-w-3xl">
          <h2 className="text-xl font-extrabold text-center mb-8">Tout ce dont tu as besoin pour vendre</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORM_PERKS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="text-sm text-foreground leading-snug">{p.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 px-4 bg-muted/20 border-y border-border">
        <div className="container max-w-3xl">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[
              { value: '5 min', label: 'pour créer ta boutique' },
              { value: '10%', label: 'commission plateforme' },
              { value: '0 FCFA', label: 'pour commencer' },
              { value: '24h', label: 'premier retrait possible' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center">
        <div className="container max-w-md space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold">Lance ta plateforme maintenant</h2>
          <p className="text-sm text-muted-foreground">Inscription gratuite. Commence à vendre en quelques minutes.</p>
          <Button size="lg" className="gap-2" onClick={handleStart}>
            🏢 Créer mon centre digital <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Suspense fallback={null}>
        <LandingFooterCompact />
      </Suspense>
    </div>
    </AdaptiveLayout>
  );
}

/**
 * Interactive revenue simulator overlay
 */
function RevenueSimulator({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const [price, setPrice] = useState(5000);
  const [ambassadors, setAmbassadors] = useState(10);
  const [commission, setCommission] = useState(20);

  const salesPerAmbassador = 3; // avg per month
  const totalSales = ambassadors * salesPerAmbassador;
  const grossRevenue = totalSales * price;
  const ambassadorCost = grossRevenue * commission / 100;
  const platformFee = grossRevenue * 10 / 100;
  const netRevenue = grossRevenue - ambassadorCost - platformFee;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="bg-card rounded-3xl border shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">💰 Simulateur de revenus</p>
          <p className="text-xs text-muted-foreground mt-1">Estime tes gains mensuels</p>
        </div>

        {/* Price slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Prix de ton produit</span>
            <span className="font-bold">{formatCurrency(price, DEFAULT_CURRENCY)}</span>
          </div>
          <Slider
            value={[price]}
            onValueChange={v => setPrice(v[0])}
            min={500} max={50000} step={500}
          />
        </div>

        {/* Ambassadors slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Nombre d'ambassadeurs</span>
            <span className="font-bold">{ambassadors}</span>
          </div>
          <Slider
            value={[ambassadors]}
            onValueChange={v => setAmbassadors(v[0])}
            min={1} max={100} step={1}
          />
        </div>

        {/* Commission slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Commission ambassadeur</span>
            <span className="font-bold">{commission}%</span>
          </div>
          <Slider
            value={[commission]}
            onValueChange={v => setCommission(v[0])}
            min={5} max={50} step={5}
          />
        </div>

        {/* Results */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Ventes estimées/mois</span>
            <span className="font-bold">{totalSales}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Revenu brut</span>
            <span className="font-bold">{formatCurrency(grossRevenue, DEFAULT_CURRENCY)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>- Commission ambassadeurs ({commission}%)</span>
            <span>-{formatCurrency(ambassadorCost, DEFAULT_CURRENCY)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>- Frais plateforme (10%)</span>
            <span>-{formatCurrency(platformFee, DEFAULT_CURRENCY)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="text-sm font-bold">Tu gagnes</span>
            <span className="text-xl font-black text-primary">{formatCurrency(netRevenue, DEFAULT_CURRENCY)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">/mois · {salesPerAmbassador} ventes/ambassadeur en moyenne</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <Button className="flex-1 gap-1" onClick={onStart}>
            🏢 Créer mon centre <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
