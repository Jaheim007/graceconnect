import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, Heart, ShoppingBag, Users, BarChart3, Zap, Shield,
  Smartphone, Globe, Mail, Link2, Palette, Search, BookOpen,
  FileText, Share2, Award, Bell, Download, Bot, ArrowRight,
  CheckCircle, Layers, Settings, Church, GraduationCap, Briefcase, HandHeart,
  Sparkles, Eye, Star, Bookmark, Languages, FlaskConical, Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type Persona = 'all' | 'org' | 'ambassador' | 'buyer';

interface Feature {
  icon: typeof Play;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  persona: Persona[];
}

const features: Feature[] = [
  { icon: Play, title: 'Médiathèque complète', titleEn: 'Full media library', desc: 'Vidéos, podcasts, musique, replays. Diffusez du contenu gratuit ou premium à votre communauté.', descEn: 'Videos, podcasts, music, replays. Broadcast free or premium content to your community.', persona: ['org'] },
  { icon: Heart, title: 'Campagnes de dons', titleEn: 'Donation campaigns', desc: 'Lancez des collectes avec objectifs et suivi en temps réel. Vos donateurs paient par Mobile Money en un clic.', descEn: 'Launch campaigns with goals and real-time tracking. Donors pay via Mobile Money in one click.', persona: ['org', 'buyer'] },
  { icon: HandHeart, title: 'Dons & Offrandes', titleEn: 'Donations & Offerings', desc: 'Module activable pour recevoir des dons, offrandes, dîmes ou contributions.', descEn: 'Activatable module to receive donations, offerings, tithes or contributions.', persona: ['org', 'buyer'] },
  { icon: ShoppingBag, title: 'Boutique numérique', titleEn: 'Digital store', desc: 'Vendez ebooks, audio, vidéos, templates. Livraison automatique et paiement sécurisé.', descEn: 'Sell ebooks, audio, videos, templates. Automatic delivery and secure payment.', persona: ['org', 'buyer'] },
  { icon: Zap, title: 'Programme Ambassadeur', titleEn: 'Ambassador program', desc: 'Réseau d\'ambassadeurs intégré. 5% à 50% de commission sur les ventes.', descEn: 'Built-in ambassador network. 5-50% commission on sales.', persona: ['org', 'ambassador'] },
  { icon: Share2, title: 'Partage en 1 clic', titleEn: 'Share in 1 click', desc: 'Générez votre lien unique, partagez sur WhatsApp, Facebook, partout.', descEn: 'Generate your unique link, share on WhatsApp, Facebook, anywhere.', persona: ['ambassador'] },
  { icon: Download, title: 'Accès instantané', titleEn: 'Instant access', desc: 'Après achat, téléchargez immédiatement. Watermark automatique pour protéger le créateur.', descEn: 'After purchase, download immediately. Automatic watermark to protect the creator.', persona: ['buyer', 'org'] },
  { icon: Globe, title: 'Paiements internationaux', titleEn: 'International payments', desc: 'Mobile Money (Orange, MTN, Wave, Moov) + Cartes bancaires via Paystack & Stripe. 150+ pays.', descEn: 'Mobile Money (Orange, MTN, Wave, Moov) + Bank cards via Paystack & Stripe. 150+ countries.', persona: ['org', 'buyer', 'ambassador'] },
  { icon: Users, title: 'Gestion des membres', titleEn: 'Member management', desc: 'Rôles (owner, admin, editor, member, affiliate), invitations et suivi d\'engagement.', descEn: 'Roles (owner, admin, editor, member, affiliate), invitations and engagement tracking.', persona: ['org'] },
  { icon: BarChart3, title: 'Analytics avancés', titleEn: 'Advanced analytics', desc: 'Tableau de bord complet : revenus, transactions, taux de conversion, top produits. Export CSV.', descEn: 'Complete dashboard: revenue, transactions, conversion rate, top products. CSV export.', persona: ['org', 'ambassador'] },
  { icon: Mail, title: 'CRM & Campagnes email', titleEn: 'CRM & Email campaigns', desc: 'Contacts, segmentation par tags, campagnes email ciblées directement depuis l\'admin.', descEn: 'Contacts, tag segmentation, targeted email campaigns from the admin panel.', persona: ['org'] },
  { icon: Link2, title: 'Codes promo', titleEn: 'Promo codes', desc: 'Réductions en % ou montant fixe avec date d\'expiration et limite d\'utilisation.', descEn: 'Discounts in % or fixed amount with expiration date and usage limit.', persona: ['org'] },
  { icon: Palette, title: 'Page personnalisable', titleEn: 'Customizable page', desc: 'Éditez textes, images, couleurs. Votre identité, votre plateforme.', descEn: 'Edit texts, images, colors. Your identity, your platform.', persona: ['org'] },
  { icon: Bell, title: 'Notifications push', titleEn: 'Push notifications', desc: 'Envoyez des notifications en temps réel pour garder votre audience engagée.', descEn: 'Send real-time notifications to keep your audience engaged.', persona: ['org'] },
  { icon: Smartphone, title: 'App PWA installable', titleEn: 'Installable PWA app', desc: 'Installable depuis le navigateur, fonctionne hors ligne, chargement ultra-rapide.', descEn: 'Installable from the browser, works offline, ultra-fast loading.', persona: ['org', 'buyer'] },
  { icon: Shield, title: 'Vérification & Conformité', titleEn: 'Verification & Compliance', desc: 'Vérification d\'identité multi-niveaux, détection de fraude, conformité GDPR.', descEn: 'Multi-level identity verification, fraud detection, GDPR compliance.', persona: ['org'] },
  { icon: Search, title: 'SEO intégré', titleEn: 'Built-in SEO', desc: 'Balises meta, slugs personnalisés, pages optimisées pour Google.', descEn: 'Meta tags, custom slugs, Google-optimized pages.', persona: ['org'] },
  { icon: Award, title: 'Badges de confiance', titleEn: 'Trust badges', desc: 'Badges organisation vérifiée, featured, certifiée.', descEn: 'Verified, featured, certified organization badges.', persona: ['org'] },
  { icon: FileText, title: 'Export de données', titleEn: 'Data export', desc: 'Exportez membres, transactions, affiliés en CSV.', descEn: 'Export members, transactions, affiliates to CSV.', persona: ['org'] },
  { icon: Sparkles, title: 'AI Studio', titleEn: 'AI Studio', desc: 'Générez des livres, cahiers de coloriage, couvertures et audio grâce à l\'IA.', descEn: 'Generate books, coloring books, covers and audio with AI.', persona: ['org'] },
  { icon: Eye, title: 'Prévisualisation PDF sécurisée', titleEn: 'Secure PDF preview', desc: 'Vos acheteurs voient un aperçu flou (20%) avant d\'acheter.', descEn: 'Buyers see a blurred preview (20%) before purchasing.', persona: ['org', 'buyer'] },
  { icon: Star, title: 'Avis vérifiés', titleEn: 'Verified reviews', desc: 'Seuls les vrais acheteurs peuvent laisser un avis.', descEn: 'Only real buyers can leave a review.', persona: ['org', 'buyer'] },
  { icon: Bookmark, title: 'Wishlist & Favoris', titleEn: 'Wishlist & Favorites', desc: 'Sauvegardez les produits qui vous intéressent.', descEn: 'Save products you\'re interested in.', persona: ['buyer'] },
  { icon: GraduationCap, title: 'LMS & Certificats', titleEn: 'LMS & Certificates', desc: 'Créez des programmes de formation avec modules, leçons et progression.', descEn: 'Create training programs with modules, lessons and progress tracking.', persona: ['org', 'buyer'] },
  { icon: Languages, title: 'Traduction IA 1-clic', titleEn: '1-click AI translation', desc: 'Traduisez vos fiches produit en français, anglais ou espagnol instantanément.', descEn: 'Translate your product pages to French, English or Spanish instantly.', persona: ['org'] },
  { icon: FlaskConical, title: 'A/B Test de prix', titleEn: 'Price A/B testing', desc: 'Testez deux tarifs en parallèle pour trouver le prix optimal.', descEn: 'Test two prices in parallel to find the optimal price.', persona: ['org'] },
  { icon: Image, title: 'Bundles & Upsells', titleEn: 'Bundles & Upsells', desc: 'Regroupez plusieurs produits en pack à prix réduit.', descEn: 'Bundle multiple products at a reduced price.', persona: ['org', 'buyer'] },
  { icon: Settings, title: 'Support 7j/7', titleEn: '24/7 Support', desc: 'FAQ intégrée, tickets de support et accompagnement personnalisé.', descEn: 'Built-in FAQ, support tickets and personalized guidance.', persona: ['org', 'buyer', 'ambassador'] },
];

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [activePersona, setActivePersona] = useState<Persona>('all');

  const personaFilters: { key: Persona; label: string; icon: typeof Users; desc: string }[] = [
    { key: 'all', label: isFr ? 'Tout voir' : 'View all', icon: Layers, desc: isFr ? 'Toutes les fonctionnalités' : 'All features' },
    { key: 'org', label: isFr ? 'Organisations & Leaders' : 'Organizations & Leaders', icon: Church, desc: isFr ? 'Pour créer et vendre' : 'To create and sell' },
    { key: 'ambassador', label: isFr ? 'Ambassadeurs' : 'Ambassadors', icon: Share2, desc: isFr ? 'Pour partager et gagner' : 'To share and earn' },
    { key: 'buyer', label: isFr ? 'Acheteurs' : 'Buyers', icon: ShoppingBag, desc: isFr ? 'Pour découvrir et acheter' : 'To discover and buy' },
  ];

  const filtered = activePersona === 'all' ? features : features.filter(f => f.persona.includes(activePersona));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title={isFr ? 'Fonctionnalités — Siteviral' : 'Features — Siteviral'}
        description={isFr ? 'Boutique numérique, campagnes de dons, programme ambassadeur, CRM, analytics — tout ce dont votre plateforme a besoin.' : 'Digital store, donation campaigns, ambassador program, CRM, analytics — everything your platform needs.'}
        canonicalUrl="https://siteviral.com/features"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-5xl px-4 pt-20 pb-12 sm:pt-28 sm:pb-16">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center space-y-4">
            <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full">{isFr ? 'Fonctionnalités' : 'Features'}</Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              {isFr ? <>Tout ce dont vous avez besoin.<br /><span className="text-primary">Selon qui vous êtes.</span></> : <>Everything you need.<br /><span className="text-primary">Based on who you are.</span></>}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              {isFr ? 'Organisation, leader, ambassadeur ou acheteur — tout le monde gagne, tout le monde monétise.' : 'Organization, leader, ambassador or buyer — everyone wins, everyone monetizes.'}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border/40 py-3">
        <div className="container max-w-5xl px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {personaFilters.map(pf => (
              <button key={pf.key} onClick={() => setActivePersona(pf.key)}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap', activePersona === pf.key ? 'bg-primary text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                <pf.icon className="h-3.5 w-3.5" /> {pf.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <motion.div key={activePersona} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((f) => (
              <div key={f.title} className="group bg-card rounded-2xl border border-border p-7 hover:border-primary/20 transition-colors duration-200 space-y-4 shadow-card">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-base">{isFr ? f.title : f.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{isFr ? f.desc : f.descEn}</p>
                <div className="flex flex-wrap gap-1">
                  {f.persona.map(p => (
                    <span key={p} className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5 capitalize">
                      {p === 'org' ? '🏢 Org' : p === 'ambassador' ? (isFr ? '🚀 Ambassadeur' : '🚀 Ambassador') : (isFr ? '🛒 Acheteur' : '🛒 Buyer')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">{isFr ? 'Aucune fonctionnalité dans cette catégorie.' : 'No features in this category.'}</p>}
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold">{isFr ? 'Prêt à commencer ?' : 'Ready to get started?'}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{isFr ? '0 FCFA d\'abonnement. Commission de 10% uniquement quand vous vendez. Zéro risque.' : '$0 subscription. 10% commission only when you sell. Zero risk.'}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="gap-2 px-8 cta-glow" onClick={() => navigate('/auth?mode=signup')}>
                {isFr ? 'Créer ma plateforme' : 'Create my platform'} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 px-8" onClick={() => navigate('/auth?mode=signup')}>
                {isFr ? 'Devenir ambassadeur' : 'Become an ambassador'} <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
