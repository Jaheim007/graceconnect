import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, Heart, ShoppingBag, Users, BarChart3, Zap, Shield,
  Smartphone, Globe, Mail, Link2, Palette, Search, BookOpen,
  FileText, Share2, Award, Bell, Download, Bot, ArrowRight,
  CheckCircle, Layers, Settings, Church, GraduationCap, Briefcase,
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

type Persona = 'all' | 'org' | 'ambassador' | 'buyer';

const personaFilters: { key: Persona; label: string; icon: typeof Users; desc: string }[] = [
  { key: 'all', label: 'Tout voir', icon: Layers, desc: 'Toutes les fonctionnalités' },
  { key: 'org', label: 'Organisations', icon: Church, desc: 'Pour créer et vendre' },
  { key: 'ambassador', label: 'Ambassadeurs', icon: Share2, desc: 'Pour partager et gagner' },
  { key: 'buyer', label: 'Acheteurs', icon: ShoppingBag, desc: 'Pour découvrir et acheter' },
];

interface Feature {
  icon: typeof Play;
  title: string;
  desc: string;
  persona: Persona[];
}

const features: Feature[] = [
  { icon: Play, title: 'Médiathèque complète', desc: 'Vidéos, podcasts, musique, replays. Diffusez du contenu gratuit ou premium à votre communauté.', persona: ['org'] },
  { icon: Heart, title: 'Campagnes de dons', desc: 'Lancez des collectes avec objectifs et suivi en temps réel. Vos donateurs paient par Mobile Money en un clic.', persona: ['org', 'buyer'] },
  { icon: ShoppingBag, title: 'Boutique numérique', desc: 'Vendez ebooks, formations, templates. Livraison automatique et paiement sécurisé.', persona: ['org', 'buyer'] },
  { icon: Zap, title: 'Programme Ambassadeur', desc: 'Réseau d\'ambassadeurs intégré. 5% à 50% de commission, tracking, liens personnalisés, versement auto.', persona: ['org', 'ambassador'] },
  { icon: Share2, title: 'Partage en 1 clic', desc: 'Générez votre lien unique, partagez sur WhatsApp, Facebook, partout. Chaque vente est trackée.', persona: ['ambassador'] },
  { icon: Download, title: 'Accès instantané', desc: 'Après achat, téléchargez immédiatement. Watermark automatique pour protéger le créateur.', persona: ['buyer', 'org'] },
  { icon: Globe, title: 'Paiements internationaux', desc: 'Mobile Money (Orange, MTN, Wave, Moov) + Cartes bancaires via Paystack & Stripe. 150+ pays.', persona: ['org', 'buyer', 'ambassador'] },
  { icon: Users, title: 'Gestion des membres', desc: 'Rôles (owner, admin, editor, member, affiliate), invitations et suivi d\'engagement.', persona: ['org'] },
  { icon: BarChart3, title: 'Analytics avancés', desc: 'Tableau de bord complet : revenus, transactions, taux de conversion, top produits. Export CSV.', persona: ['org', 'ambassador'] },
  { icon: Mail, title: 'CRM & Campagnes email', desc: 'Contacts, segmentation par tags, campagnes email ciblées directement depuis l\'admin.', persona: ['org'] },
  { icon: Link2, title: 'Codes promo', desc: 'Réductions en % ou montant fixe avec date d\'expiration et limite d\'utilisation.', persona: ['org'] },
  { icon: BookOpen, title: 'Formations en ligne', desc: 'Parcours structurés avec modules, leçons vidéo et suivi de progression.', persona: ['org', 'buyer'] },
  { icon: Palette, title: 'Page personnalisable', desc: 'Éditez textes, images, couleurs. Réordonnez les sections. Votre identité, votre plateforme.', persona: ['org'] },
  { icon: Bell, title: 'Notifications push', desc: 'Envoyez des notifications en temps réel pour garder votre audience engagée.', persona: ['org'] },
  { icon: Smartphone, title: 'App PWA installable', desc: 'Installable depuis le navigateur, fonctionne hors ligne, chargement ultra-rapide.', persona: ['org', 'buyer'] },
  { icon: Shield, title: 'KYC & Conformité', desc: 'Vérification d\'identité multi-niveaux, détection de fraude, conformité GDPR.', persona: ['org'] },
  { icon: Search, title: 'SEO intégré', desc: 'Balises meta, slugs personnalisés, pages optimisées pour Google.', persona: ['org'] },
  { icon: Award, title: 'Badges de confiance', desc: 'Badges organisation vérifiée, featured, certifiée. Renforcez la confiance.', persona: ['org'] },
  { icon: FileText, title: 'Export de données', desc: 'Exportez membres, transactions, affiliés en CSV. Vos données vous appartiennent.', persona: ['org'] },
  { icon: Bot, title: 'IA intégrée', desc: 'Chat IA pour analyser les métriques, détecter les anomalies et optimiser.', persona: ['org'] },
  { icon: Settings, title: 'Support 7j/7', desc: 'FAQ intégrée, tickets de support et accompagnement personnalisé.', persona: ['org', 'buyer', 'ambassador'] },
];

export default function FeaturesPage() {
  const navigate = useNavigate();
  const [activePersona, setActivePersona] = useState<Persona>('all');

  const filtered = activePersona === 'all' ? features : features.filter(f => f.persona.includes(activePersona));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="Fonctionnalités — Siteviral"
        description="Médiathèque, boutique de produits numériques, campagnes de dons, programme d'affiliation, CRM, analytics, notifications push — tout ce dont votre plateforme a besoin."
        canonicalUrl="https://siteviral.com/features"
        keywords="fonctionnalités plateforme digitale, boutique en ligne, médiathèque, campagne de dons, affiliation, CRM communautaire, analytics, notifications push, Siteviral"
      />
      <LandingNav />

      {/* Hero */}
      <section className="pt-14">
        <div className="container max-w-5xl px-4 pt-20 pb-12 sm:pt-28 sm:pb-16">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center space-y-4">
            <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full">Fonctionnalités</Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Tout ce dont vous avez besoin.<br /><span className="text-primary">Selon qui vous êtes.</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Organisation, ambassadeur ou acheteur — découvrez les outils pensés pour vous.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Persona Filter Tabs */}
      <section className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border/40 py-3">
        <div className="container max-w-5xl px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {personaFilters.map(pf => (
              <button
                key={pf.key}
                onClick={() => setActivePersona(pf.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                  activePersona === pf.key
                    ? 'bg-primary text-primary-foreground shadow-card'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <pf.icon className="h-3.5 w-3.5" />
                {pf.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((f) => (
              <div key={f.title} className="group bg-card rounded-2xl border border-border p-7 hover:border-primary/20 transition-colors duration-200 space-y-4 shadow-card">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {f.persona.map(p => (
                    <span key={p} className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5 capitalize">
                      {p === 'org' ? '🏢 Org' : p === 'ambassador' ? '🚀 Ambassadeur' : '🛒 Acheteur'}
                    </span>
                  ))}
                </div>
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
            <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à commencer ?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">0 FCFA d'abonnement. Commission de 10% uniquement quand vous vendez. Zéro risque.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="gap-2 px-8 cta-glow" onClick={() => navigate('/auth?mode=signup')}>
                Créer ma plateforme <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 px-8" onClick={() => navigate('/auth?mode=signup')}>
                Devenir ambassadeur <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
