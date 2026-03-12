import { Shield, Lock, Eye, CreditCard, UserCheck, RefreshCw, Scale, Bell, FileCheck, Fingerprint, Layers, FileWarning } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

export default function ProtectionPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const LAYERS = [
    {
      icon: Lock,
      title: isFr ? 'Chiffrement SSL/TLS' : 'SSL/TLS Encryption',
      desc: isFr ? 'Toutes les données transitent via HTTPS avec chiffrement de bout en bout. Aucune information sensible ne circule en clair.' : 'All data travels via HTTPS with end-to-end encryption. No sensitive information is transmitted in plain text.',
      color: 'text-blue-500', bg: 'bg-blue-500/10',
    },
    {
      icon: Fingerprint,
      title: isFr ? 'Watermark invisible' : 'Invisible watermark',
      desc: isFr ? 'Chaque fichier téléchargé est marqué avec l\'email de l\'acheteur en 8 couches superposées — micro-textes, diagonales et empreintes forensiques à 2% d\'opacité.' : 'Every downloaded file is marked with the buyer\'s email in 8 overlapping layers — micro-texts, diagonals and forensic fingerprints at 2% opacity.',
      color: 'text-violet-500', bg: 'bg-violet-500/10',
    },
    {
      icon: CreditCard,
      title: isFr ? 'Paiements certifiés PCI-DSS' : 'PCI-DSS certified payments',
      desc: isFr ? 'Stripe et Paystack gèrent les paiements avec la certification PCI-DSS Level 1. Aucune donnée bancaire n\'est stockée sur nos serveurs.' : 'Stripe and Paystack handle payments with PCI-DSS Level 1 certification. No banking data is stored on our servers.',
      color: 'text-emerald-500', bg: 'bg-emerald-500/10',
    },
    {
      icon: UserCheck,
      title: isFr ? 'Vérification vendeur obligatoire' : 'Mandatory seller verification',
      desc: isFr ? 'Tout vendeur doit vérifier son identité avant de pouvoir retirer ses gains. Les fonds sont sécurisés tant que la vérification n\'est pas complète.' : 'Every seller must verify their identity before withdrawing earnings. Funds are secured until verification is complete.',
      color: 'text-amber-500', bg: 'bg-amber-500/10',
    },
    {
      icon: Scale,
      title: isFr ? 'Détection anti-fraude' : 'Anti-fraud detection',
      desc: isFr ? 'Analyse automatique des transactions suspectes : doublons, adresses IP multiples, achats rapides inhabituels. Les comptes suspects sont gelés.' : 'Automatic analysis of suspicious transactions: duplicates, multiple IP addresses, unusual rapid purchases. Suspicious accounts are frozen.',
      color: 'text-red-500', bg: 'bg-red-500/10',
    },
    {
      icon: Layers,
      title: isFr ? 'Prévisualisation sécurisée' : 'Secure preview',
      desc: isFr ? 'Les acheteurs voient 20% du contenu en aperçu. La dernière page visible est floutée. Impossible de copier ou capturer le fichier complet.' : 'Buyers see 20% of content in preview. The last visible page is blurred. Impossible to copy or capture the full file.',
      color: 'text-cyan-500', bg: 'bg-cyan-500/10',
    },
    {
      icon: Bell,
      title: isFr ? 'Alertes en temps réel' : 'Real-time alerts',
      desc: isFr ? 'Notifications instantanées pour chaque vente, téléchargement et activité suspecte. Les vendeurs gardent un contrôle total sur leur contenu.' : 'Instant notifications for every sale, download and suspicious activity. Sellers maintain full control over their content.',
      color: 'text-orange-500', bg: 'bg-orange-500/10',
    },
    {
      icon: FileCheck,
      title: isFr ? 'Conformité RGPD & données' : 'GDPR & data compliance',
      desc: isFr ? 'Protection des données personnelles conforme au RGPD et au CCPA. Droit à l\'oubli, export et suppression sur demande.' : 'Personal data protection compliant with GDPR and CCPA. Right to be forgotten, export and deletion on request.',
      color: 'text-teal-500', bg: 'bg-teal-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? "Protection de tes contenus — 8 couches de sécurité | SiteViral" : "Content Protection — 8 Security Layers | SiteViral"}
        description={isFr ? "Découvre comment SiteViral protège tes créations numériques avec 8 couches de sécurité." : "Discover how SiteViral protects your digital creations with 8 security layers."}
        canonicalUrl="https://siteviral.com/protection"
      />

      <div className="container max-w-3xl px-4 py-12 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">
            🛡️ {isFr ? 'Tes contenus sont protégés' : 'Your content is protected'}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isFr
              ? '8 couches de sécurité pour que tu puisses publier en toute confiance. Ton travail est entre de bonnes mains.'
              : '8 security layers so you can publish with confidence. Your work is in good hands.'}
          </p>
        </motion.div>

        <div className="space-y-4 mb-12">
          {LAYERS.map((layer, i) => (
            <motion.div
              key={i}
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
                  <span className="text-xs font-bold text-muted-foreground">{isFr ? 'Couche' : 'Layer'} {i + 1}</span>
                </div>
                <h3 className="font-bold text-sm mb-1">{layer.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center space-y-4">
          <p className="text-lg font-bold">{isFr ? 'Publie en confiance. On protège ton travail. 💪' : 'Publish with confidence. We protect your work. 💪'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2" onClick={() => navigate('/ecrire')}>
              ✏️ {isFr ? 'Écrire mon livre' : 'Write my book'}
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate('/migrer')}>
              📤 {isFr ? 'Importer mon contenu' : 'Import my content'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
