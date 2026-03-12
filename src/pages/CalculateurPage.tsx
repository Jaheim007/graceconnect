import { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Calculator, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function CalculateurPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const numLoc = isFr ? 'fr-FR' : 'en-US';
  const [mode, setMode] = useState<'vendeur' | 'ambassadeur'>('vendeur');

  // Vendeur state
  const [produitPrix, setProduitPrix] = useState(5000);
  const [ventesJour, setVentesJour] = useState(3);
  const [nbProduits, setNbProduits] = useState(2);

  // Ambassadeur state
  const [partagesJour, setPartagesJour] = useState(5);
  const [tauxConversion, setTauxConversion] = useState(10);
  const [commissionPct, setCommissionPct] = useState(15);
  const [prixMoyen, setPrixMoyen] = useState(5000);

  // Vendeur calculations
  const vendeurBrut = produitPrix * ventesJour * nbProduits * 30;
  const vendeurNet = Math.round(vendeurBrut * 0.9); // 10% platform fee
  const vendeurAnnuel = vendeurNet * 12;

  // Ambassadeur calculations
  const ventesAmbassadeur = Math.round(partagesJour * (tauxConversion / 100) * 30);
  const ambassadeurBrut = ventesAmbassadeur * prixMoyen;
  const ambassadeurCommission = Math.round(ambassadeurBrut * (commissionPct / 100));
  const ambassadeurAnnuel = ambassadeurCommission * 12;

  const formatFCFA = (n: number) => n.toLocaleString(numLoc) + ' FCFA';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Calculateur de Revenus — Estimez vos gains sur Siteviral"
        description="Simulez vos revenus potentiels en tant que vendeur ou ambassadeur sur Siteviral. Gratuit, transparent, instantané."
        canonicalUrl="https://siteviral.com/calculateur"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-12 sm:pt-32 text-center space-y-5">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border gap-1.5">
            <Calculator className="h-3.5 w-3.5" /> Calculateur de revenus
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Combien pouvez-vous <span className="text-primary">gagner</span> ?
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Estimez vos revenus potentiels en quelques secondes. Ajustez les curseurs selon votre situation.
          </p>
        </div>
      </section>

      {/* Mode toggle */}
      <section className="pb-8">
        <div className="container max-w-lg px-4">
          <div className="flex rounded-xl border border-border bg-card p-1 gap-1">
            <button
              onClick={() => setMode('vendeur')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'vendeur' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏪 Vendeur / Organisation
            </button>
            <button
              onClick={() => setMode('ambassadeur')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'ambassadeur' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🚀 Ambassadeur
            </button>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-20 px-4">
        <div className="container max-w-2xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="p-6 sm:p-8 rounded-3xl border border-border bg-card space-y-8">
            {mode === 'vendeur' ? (
              <>
                <SliderField label="Prix moyen d'un produit" value={produitPrix} onChange={setProduitPrix} min={500} max={100000} step={500} format={formatFCFA} />
                <SliderField label="Ventes par jour (par produit)" value={ventesJour} onChange={setVentesJour} min={1} max={50} step={1} format={(v) => `${v} ventes/jour`} />
                <SliderField label="Nombre de produits" value={nbProduits} onChange={setNbProduits} min={1} max={20} step={1} format={(v) => `${v} produit${v > 1 ? 's' : ''}`} />

                <div className="border-t border-border pt-6 space-y-4">
                  <ResultRow label="Revenu brut / mois" value={formatFCFA(vendeurBrut)} />
                  <ResultRow label="Commission Siteviral (10%)" value={`- ${formatFCFA(Math.round(vendeurBrut * 0.1))}`} muted />
                  <ResultRow label="Votre revenu net / mois" value={formatFCFA(vendeurNet)} highlight />
                  <ResultRow label="Projection annuelle" value={formatFCFA(vendeurAnnuel)} />
                </div>
              </>
            ) : (
              <>
                <SliderField label="Partages par jour" value={partagesJour} onChange={setPartagesJour} min={1} max={50} step={1} format={(v) => `${v} partages/jour`} />
                <SliderField label="Taux de conversion" value={tauxConversion} onChange={setTauxConversion} min={1} max={30} step={1} format={(v) => `${v}%`} />
                <SliderField label="Prix moyen des produits" value={prixMoyen} onChange={setPrixMoyen} min={500} max={100000} step={500} format={formatFCFA} />
                <SliderField label="Votre commission" value={commissionPct} onChange={setCommissionPct} min={5} max={50} step={1} format={(v) => `${v}%`} />

                <div className="border-t border-border pt-6 space-y-4">
                  <ResultRow label="Ventes générées / mois" value={`${ventesAmbassadeur} ventes`} />
                  <ResultRow label="Volume de ventes" value={formatFCFA(ambassadeurBrut)} muted />
                  <ResultRow label="Vos commissions / mois" value={formatFCFA(ambassadeurCommission)} highlight />
                  <ResultRow label="Projection annuelle" value={formatFCFA(ambassadeurAnnuel)} />
                </div>
              </>
            )}
          </motion.div>

          <div className="mt-8 text-center space-y-4">
            <p className="text-xs text-muted-foreground">
              * Estimation indicative. Les résultats réels dépendent de votre activité, réseau et produits.
            </p>
            <Button size="lg" className="px-8 gap-2 h-13 text-base group cta-glow" onClick={() => navigate('/auth?mode=signup')}>
              Commencer gratuitement <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold text-primary">{format(value)}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="w-full" />
    </div>
  );
}

function ResultRow({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${highlight ? 'py-3 px-4 rounded-xl bg-primary/10' : ''}`}>
      <span className={`text-sm ${muted ? 'text-muted-foreground' : ''}`}>{label}</span>
      <span className={`font-bold ${highlight ? 'text-lg text-primary' : muted ? 'text-muted-foreground text-sm' : 'text-sm'}`}>{value}</span>
    </div>
  );
}
