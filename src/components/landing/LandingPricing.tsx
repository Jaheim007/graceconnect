import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const benefits = [
  'Création de plateforme gratuite',
  'Publication de contenu illimitée',
  'Boutique numérique complète',
  'Collecte de dons & offrandes',
  'Programme ambassadeur intégré',
  'Tableau de bord analytique',
  'Paiement Mobile Money & Carte',
  'Watermark automatique sur documents',
  'Notifications par email',
  'Support communautaire',
];

const comparison = [
  { label: 'Abonnement mensuel', before: '15 000 – 50 000 FCFA', after: '0 FCFA' },
  { label: 'Commission par vente', before: '15 – 30%', after: '10% seulement' },
  { label: 'Programme ambassadeur', before: 'Non inclus', after: 'Intégré' },
  { label: 'Mobile Money', before: 'Rarement', after: 'Natif' },
  { label: 'Watermark auto', before: 'Non', after: 'Oui' },
];

export function LandingPricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 px-4 bg-muted/30 scroll-mt-16">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Tarification</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Zéro abonnement. <span className="text-primary">Zéro risque.</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Siteviral ne gagne que quand vous gagnez. Pas de frais cachés, pas d'engagement.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="relative rounded-3xl border-2 border-primary bg-card overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Modèle unique</span>
                  </div>
                  <h3 className="text-4xl sm:text-5xl font-extrabold">
                    0 <span className="text-lg font-medium text-muted-foreground">FCFA / mois</span>
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Commission de <span className="font-bold text-foreground">10%</span> uniquement sur les ventes réalisées
                  </p>
                </div>
                <Button size="lg" className="gap-2 h-13 px-8 text-base w-full sm:w-auto group" onClick={() => navigate('/auth?mode=signup')}>
                  Commencer gratuitement <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="border-t border-border pt-8">
                <p className="text-sm font-bold mb-4">Tout est inclus :</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {benefits.map((b) => (
                    <div key={b} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Pas de carte requise', 'Pas d\'engagement', 'Pas de frais cachés'].map((t) => (
                  <span key={t} className="text-xs text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 border border-border">
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Before vs After comparison */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-10">
          <h3 className="text-center font-bold text-lg mb-6">Avant vs Avec Siteviral</h3>
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-3 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 p-3">
              <span />
              <span className="text-center">Autres plateformes</span>
              <span className="text-center text-primary">Siteviral</span>
            </div>
            {comparison.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 items-center text-sm p-3 ${i < comparison.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="font-medium">{row.label}</span>
                <span className="text-center text-muted-foreground flex items-center justify-center gap-1">
                  <X className="h-3 w-3 text-destructive/60" /> {row.before}
                </span>
                <span className="text-center font-semibold text-primary flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {row.after}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
