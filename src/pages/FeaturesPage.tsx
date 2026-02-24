import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, Heart, ShoppingBag, Users, BarChart3, Zap, Shield,
  Smartphone, Globe, Megaphone, Mail, Link2, Palette, Search,
  FileText, Share2, Award, BookOpen, Bell, Download, Bot,
  ArrowRight, CheckCircle, Layers, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type Category = 'all' | 'marketing' | 'automation' | 'management' | 'credibility' | 'mobile' | 'experience';

const categories: { key: Category; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'automation', label: 'Automatisation' },
  { key: 'management', label: 'Gestion' },
  { key: 'credibility', label: 'Crédibilité' },
  { key: 'mobile', label: 'Mobilité' },
  { key: 'experience', label: 'Expérience Client' },
];

interface Feature {
  icon: typeof Play;
  title: string;
  desc: string;
  category: Category[];
  highlight?: boolean;
}

const features: Feature[] = [
  { icon: Play, title: 'Médiathèque', desc: 'Partagez vidéos, musique, podcasts et replays en direct. Diffusez du contenu premium réservé à vos membres.', category: ['marketing', 'experience'] },
  { icon: Heart, title: 'Campagnes de dons', desc: 'Lancez des collectes de fonds avec objectifs, suivi en temps réel et paiements sécurisés via Paystack.', category: ['marketing'] },
  { icon: ShoppingBag, title: 'Boutique digitale', desc: 'Vendez ebooks, formations, templates et ressources numériques avec livraison automatique et paiement sécurisé.', category: ['marketing', 'experience'] },
  { icon: Users, title: 'Gestion des membres', desc: 'Invitez, gérez les rôles (owner, admin, editor, member, affiliate) et suivez l\'engagement de chaque membre.', category: ['management'] },
  { icon: BarChart3, title: 'Analytics avancés', desc: 'Tableau de bord complet : revenus, transactions, membres, taux de conversion, top produits. Exportez vos données en CSV.', category: ['management'] },
  { icon: Zap, title: 'Programme d\'affiliation', desc: 'Créez un réseau d\'affiliés qui promeuvent vos produits. Commissions automatiques, tracking, liens personnalisés.', category: ['marketing', 'automation'] },
  { icon: Mail, title: 'CRM & Email', desc: 'Gérez vos contacts, segmentez par tags, et lancez des campagnes email ciblées directement depuis le panneau admin.', category: ['marketing', 'automation'] },
  { icon: Link2, title: 'Codes promo', desc: 'Créez des codes de réduction en pourcentage ou montant fixe avec date d\'expiration et limite d\'utilisation.', category: ['marketing'] },
  { icon: Palette, title: 'Page publique personnalisable', desc: 'Éditeur inline : modifiez textes, images, couleurs et réordonnez les sections par drag & drop.', category: ['experience'] },
  { icon: BookOpen, title: 'Programmes de formation', desc: 'Créez des parcours structurés avec modules, leçons vidéo et suivi de progression des apprenants.', category: ['experience', 'management'] },
  { icon: Bell, title: 'Notifications push', desc: 'Envoyez des notifications push en temps réel à vos membres pour les garder engagés.', category: ['automation', 'mobile'] },
  { icon: Smartphone, title: 'Application PWA', desc: 'App installable depuis le navigateur, fonctionne hors ligne, chargement ultra-rapide sur tous les appareils.', category: ['mobile'] },
  { icon: Shield, title: 'KYC & Conformité', desc: 'Vérification d\'identité multi-niveaux, détection de fraude automatique, conformité GDPR et AML.', category: ['credibility', 'management'] },
  { icon: Download, title: 'Livraison automatique', desc: 'Les fichiers achetés sont livrés instantanément. Téléchargement sécurisé avec watermark et logs.', category: ['automation', 'experience'] },
  { icon: Globe, title: 'Paiements internationaux', desc: 'Acceptez Mobile Money, cartes bancaires et plus dans 150+ pays via Paystack. Retraits rapides.', category: ['credibility'] },
  { icon: Search, title: 'SEO intégré', desc: 'Balises meta, pages optimisées pour Google, slugs personnalisés. Attirez des clients sans publicité.', category: ['marketing'] },
  { icon: Share2, title: 'Outils de partage affilié', desc: 'Liens de partage avec prévisualisation, copie en un clic, et liens produit-spécifiques pour chaque affilié.', category: ['marketing'] },
  { icon: Award, title: 'Badges & vérification', desc: 'Badges organisation vérifiée, featured, et certifiée pour renforcer la confiance de vos visiteurs.', category: ['credibility'] },
  { icon: FileText, title: 'Export de données', desc: 'Exportez membres, transactions, affiliés en CSV. Vos données vous appartiennent.', category: ['management'] },
  { icon: Layers, title: 'Multi-organisation', desc: 'Gérez plusieurs organisations depuis un seul compte. Basculez entre elles en un clic.', category: ['management'] },
  { icon: Bot, title: 'IA intégrée', desc: 'Assistance IA pour le superadmin : chat intelligent pour analyser les métriques, détecter les anomalies et prendre des décisions.', category: ['automation'] },
  { icon: Settings, title: 'Support 7j/7', desc: 'Centre d\'aide intégré avec FAQ, tickets de support et suivi. Réponse rapide et accompagnement personnalisé.', category: ['experience'] },
];

export default function FeaturesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filtered = activeCategory === 'all' ? features : features.filter(f => f.category.includes(activeCategory));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead title="Fonctionnalités — Siteviral" description="Découvrez toutes les fonctionnalités de Siteviral : médiathèque, boutique, dons, affiliation, CRM, analytics et plus." />
      <LandingNav />

      {/* Hero */}
      <section className="pt-14">
        <div className="container max-w-5xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center space-y-4">
            <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full">Fonctionnalités</Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Tout ce dont vous avez besoin.<br /><span className="text-primary">En un seul endroit.</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Des outils puissants pour partager, vendre, collecter et développer votre activité. Siteviral vous donne le contrôle total de votre réussite en ligne.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border/40 py-3">
        <div className="container max-w-5xl px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                  activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((f) => (
              <div key={f.title} className="group bg-card rounded-2xl border border-border p-7 hover:border-primary/20 transition-colors duration-200 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </motion.div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Aucune fonctionnalité dans cette catégorie.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à découvrir toutes nos fonctionnalités ?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Créez votre organisation gratuitement et accédez à tous les outils dont vous avez besoin pour réussir en ligne.</p>
            <Button size="lg" className="gap-2 px-8" onClick={() => navigate('/auth?mode=signup')}>
              Commencer gratuitement <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
