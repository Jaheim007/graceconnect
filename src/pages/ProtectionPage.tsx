import { Shield, Lock, Eye, CreditCard, UserCheck, RefreshCw, Scale, Bell, FileCheck, Fingerprint, Layers, FileWarning } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LAYERS = [
  {
    icon: Lock,
    title: 'Chiffrement SSL/TLS',
    desc: 'Toutes les données transitent via HTTPS avec chiffrement de bout en bout. Aucune information sensible ne circule en clair.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Fingerprint,
    title: 'Watermark invisible',
    desc: 'Chaque fichier téléchargé est marqué avec l\'email de l\'acheteur en 8 couches superposées — micro-textes, diagonales et empreintes forensiques à 2% d\'opacité.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: CreditCard,
    title: 'Paiements certifiés PCI-DSS',
    desc: 'Stripe et Paystack gèrent les paiements avec la certification PCI-DSS Level 1. Aucune donnée bancaire n\'est stockée sur nos serveurs.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: UserCheck,
    title: 'KYC vendeur obligatoire',
    desc: 'Tout vendeur doit vérifier son identité avant de pouvoir retirer ses gains. Les fonds sont sécurisés tant que la vérification n\'est pas complète.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Scale,
    title: 'Détection anti-fraude',
    desc: 'Analyse automatique des transactions suspectes : doublons, adresses IP multiples, achats rapides inhabituels. Les comptes suspects sont gelés.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Layers,
    title: 'Prévisualisation sécurisée',
    desc: 'Les acheteurs voient 20% du contenu en aperçu. La dernière page visible est floutée. Impossible de copier ou capturer le fichier complet.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Bell,
    title: 'Alertes en temps réel',
    desc: 'Notifications instantanées pour chaque vente, téléchargement et activité suspecte. Les vendeurs gardent un contrôle total sur leur contenu.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: FileCheck,
    title: 'Conformité RGPD & données',
    desc: 'Protection des données personnelles conforme au RGPD et au CCPA. Droit à l\'oubli, export et suppression sur demande.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
];

export default function ProtectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Protection de tes contenus — 8 couches de sécurité | SiteViral"
        description="Découvre comment SiteViral protège tes créations numériques avec 8 couches de sécurité : watermark invisible, chiffrement, anti-fraude et plus."
        canonicalUrl="https://siteviral.com/protection"
      />

      <div className="container max-w-3xl px-4 py-12 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            🛡️ Tes contenus sont protégés
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            8 couches de sécurité pour que tu puisses publier en toute confiance.
            Ton travail est entre de bonnes mains.
          </p>
        </motion.div>

        {/* Layers grid */}
        <div className="space-y-4 mb-12">
          {LAYERS.map((layer, i) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-accent/30 transition-colors"
            >
              <div className={`h-11 w-11 rounded-xl ${layer.bg} flex items-center justify-center shrink-0`}>
                <layer.icon className={`h-5 w-5 ${layer.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground">Couche {i + 1}</span>
                </div>
                <h3 className="font-bold text-sm mb-1">{layer.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-4"
        >
          <p className="text-lg font-bold">Publie en confiance. On protège ton travail. 💪</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2" onClick={() => navigate('/ecrire')}>
              ✏️ Écrire mon livre
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate('/migrer')}>
              📤 Importer mon contenu
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
