import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Share2, ShoppingBag, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import platformImg from '@/assets/landing-platform.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const tabs = [
  {
    id: 'org',
    label: 'Je crée ma plateforme',
    icon: Building2,
    steps: [
      'Créez un compte en 30 secondes (Google ou email)',
      'Nommez votre plateforme et ajoutez votre logo',
      'Publiez vos ressources : ebooks, vidéos, audio, documents',
      'Lancez une campagne de dons si vous le souhaitez',
      'Recevez vos paiements par Mobile Money ou virement',
    ],
    highlight: 'Zéro abonnement. Vous ne payez que 10% quand vous gagnez.',
  },
  {
    id: 'ambassador',
    label: 'Je gagne en partageant',
    icon: Share2,
    steps: [
      'Inscrivez-vous gratuitement sur Siteviral',
      'Parcourez les ressources disponibles',
      'Générez votre lien ambassadeur en un clic',
      'Partagez sur WhatsApp, Facebook, X, partout',
      'Touchez votre commission sur chaque vente (5-50%)',
    ],
    highlight: 'Aucun contenu à créer. Vous gagnez juste en partageant.',
  },
  {
    id: 'buyer',
    label: 'J\'achète du contenu',
    icon: ShoppingBag,
    steps: [
      'Découvrez des ressources numériques de qualité',
      'Payez par Mobile Money (Orange, MTN, Moov) ou carte',
      'Accédez instantanément à votre achat',
      'Retrouvez tout dans votre bibliothèque personnelle',
      'Soutenez des créateurs et communautés',
    ],
    highlight: 'Paiement sécurisé. Accès immédiat. Watermark de protection.',
  },
];

export function LandingHowItWorks() {
  const [activeTab, setActiveTab] = useState('org');
  const tab = tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="py-24 px-4">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Comment ça marche</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            Simple comme <span className="text-primary">1, 2, 3</span>
          </h2>
        </motion.div>

        {/* Tab pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                activeTab === t.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {tab.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-4 bg-primary/5 rounded-lg p-3 border border-primary/10">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-medium text-primary">{tab.highlight}</p>
            </div>
          </motion.div>

          <motion.div
            key={`img-${activeTab}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden border border-border"
          >
            <img src={platformImg} alt="Siteviral en action" className="w-full h-auto object-cover" loading="lazy" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
