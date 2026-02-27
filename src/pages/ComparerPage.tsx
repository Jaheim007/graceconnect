import { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, X, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const competitors = [
  { id: 'gumroad', name: 'Gumroad', logo: '🟡' },
  { id: 'shopify', name: 'Shopify', logo: '🟢' },
  { id: 'patreon', name: 'Patreon', logo: '🟠' },
  { id: 'teachable', name: 'Teachable', logo: '🔵' },
  { id: 'flutterwave', name: 'Flutterwave Store', logo: '🟣' },
  { id: 'gofundme', name: 'GoFundMe', logo: '🔴' },
];

type FeatureStatus = 'yes' | 'no' | 'partial';

interface Feature {
  category: string;
  name: string;
  siteviral: FeatureStatus;
  competitors: Record<string, FeatureStatus>;
}

const features: Feature[] = [
  {
    category: 'Paiement',
    name: 'Mobile Money (MTN, Orange, Wave)',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'no', patreon: 'no', teachable: 'no', flutterwave: 'yes', gofundme: 'no' },
  },
  {
    category: 'Paiement',
    name: 'Carte bancaire (Visa, Mastercard)',
    siteviral: 'yes',
    competitors: { gumroad: 'yes', shopify: 'yes', patreon: 'yes', teachable: 'yes', flutterwave: 'yes', gofundme: 'yes' },
  },
  {
    category: 'Paiement',
    name: 'Zéro abonnement mensuel',
    siteviral: 'yes',
    competitors: { gumroad: 'yes', shopify: 'no', patreon: 'yes', teachable: 'no', flutterwave: 'yes', gofundme: 'yes' },
  },
  {
    category: 'Paiement',
    name: 'Commission ≤ 7%',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'partial', patreon: 'partial', teachable: 'no', flutterwave: 'yes', gofundme: 'no' },
  },
  {
    category: 'Produits',
    name: 'Vente de produits numériques',
    siteviral: 'yes',
    competitors: { gumroad: 'yes', shopify: 'yes', patreon: 'yes', teachable: 'yes', flutterwave: 'partial', gofundme: 'no' },
  },
  {
    category: 'Produits',
    name: 'Livraison automatique de fichiers',
    siteviral: 'yes',
    competitors: { gumroad: 'yes', shopify: 'partial', patreon: 'partial', teachable: 'yes', flutterwave: 'no', gofundme: 'no' },
  },
  {
    category: 'Produits',
    name: 'Bundles & packs',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'partial', patreon: 'no', teachable: 'yes', flutterwave: 'no', gofundme: 'no' },
  },
  {
    category: 'Marketing',
    name: 'Programme ambassadeur / affiliation',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'partial', patreon: 'no', teachable: 'partial', flutterwave: 'no', gofundme: 'no' },
  },
  {
    category: 'Marketing',
    name: 'Codes promo',
    siteviral: 'yes',
    competitors: { gumroad: 'yes', shopify: 'yes', patreon: 'no', teachable: 'yes', flutterwave: 'no', gofundme: 'no' },
  },
  {
    category: 'Communauté',
    name: 'Collecte de dons / crowdfunding',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'no', patreon: 'partial', teachable: 'no', flutterwave: 'no', gofundme: 'yes' },
  },
  {
    category: 'Communauté',
    name: 'Événements & annonces',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'no', patreon: 'partial', teachable: 'no', flutterwave: 'no', gofundme: 'no' },
  },
  {
    category: 'Communauté',
    name: 'Gestion de membres',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'no', patreon: 'yes', teachable: 'yes', flutterwave: 'no', gofundme: 'no' },
  },
  {
    category: 'Technique',
    name: 'Interface en français',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'partial', patreon: 'no', teachable: 'no', flutterwave: 'partial', gofundme: 'no' },
  },
  {
    category: 'Technique',
    name: 'PWA / App mobile',
    siteviral: 'yes',
    competitors: { gumroad: 'no', shopify: 'yes', patreon: 'yes', teachable: 'partial', flutterwave: 'no', gofundme: 'no' },
  },
  {
    category: 'Technique',
    name: 'Multi-devises (XOF, XAF, USD…)',
    siteviral: 'yes',
    competitors: { gumroad: 'partial', shopify: 'yes', patreon: 'partial', teachable: 'partial', flutterwave: 'yes', gofundme: 'partial' },
  },
];

const StatusIcon = ({ status }: { status: FeatureStatus }) => {
  if (status === 'yes') return <Check className="h-4 w-4 text-green-500" />;
  if (status === 'no') return <X className="h-4 w-4 text-destructive/60" />;
  return <Minus className="h-4 w-4 text-yellow-500" />;
};

export default function ComparerPage() {
  const [selected, setSelected] = useState<string[]>(['gumroad', 'shopify']);

  const toggleCompetitor = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(c => c !== id) : prev
        : prev.length < 3 ? [...prev, id] : [...prev.slice(1), id]
    );
  };

  const selectedCompetitors = competitors.filter(c => selected.includes(c.id));
  const categories = [...new Set(features.map(f => f.category))];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Comparer Siteviral — vs Gumroad, Shopify, Patreon, Teachable"
        description="Comparez Siteviral avec les autres plateformes : fonctionnalités, frais, paiement Mobile Money, programme ambassadeur. Trouvez la meilleure solution."
        canonicalUrl="https://siteviral.com/comparer"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-5xl px-4 pt-24 pb-10 sm:pt-32 text-center space-y-5">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border">
            ⚖️ Outil de comparaison
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Siteviral vs <span className="text-primary">la concurrence</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Comparez les fonctionnalités, les frais et les capacités. Choisissez jusqu'à 3 concurrents.
          </p>
        </div>
      </section>

      {/* Competitor selector */}
      <section className="sticky top-14 z-20 bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container max-w-5xl px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {competitors.map(c => (
              <button
                key={c.id}
                onClick={() => toggleCompetitor(c.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  selected.includes(c.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{c.logo}</span> {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-10 px-4">
        <div className="container max-w-5xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[200px] sm:w-[280px]">Fonctionnalité</th>
                  <th className="text-center py-3 px-3 font-bold text-primary min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">⚡</span>
                      <span>Siteviral</span>
                    </div>
                  </th>
                  {selectedCompetitors.map(c => (
                    <th key={c.id} className="text-center py-3 px-3 font-medium text-muted-foreground min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">{c.logo}</span>
                        <span>{c.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <>
                    <tr key={cat}>
                      <td colSpan={2 + selectedCompetitors.length} className="pt-6 pb-2 px-3">
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">{cat}</Badge>
                      </td>
                    </tr>
                    {features.filter(f => f.category === cat).map(f => (
                      <motion.tr
                        key={f.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-3 text-xs font-medium">{f.name}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex justify-center">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <StatusIcon status={f.siteviral} />
                            </div>
                          </div>
                        </td>
                        {selectedCompetitors.map(c => (
                          <td key={c.id} className="py-3 px-3 text-center">
                            <div className="flex justify-center">
                              <StatusIcon status={f.competitors[c.id]} />
                            </div>
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              <Check className="inline h-3 w-3 text-green-500" /> Oui &nbsp;
              <Minus className="inline h-3 w-3 text-yellow-500" /> Partiel &nbsp;
              <X className="inline h-3 w-3 text-destructive/60" /> Non
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Convaincu ?</h2>
          <p className="text-primary-foreground/80">
            Créez votre plateforme gratuitement. Zéro abonnement, zéro risque.
          </p>
          <Button size="lg" variant="secondary" className="px-8 h-13 text-base gap-2 group" onClick={() => window.location.href = '/auth?mode=signup'}>
            Commencer gratuitement <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
