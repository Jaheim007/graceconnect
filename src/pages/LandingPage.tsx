import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Heart, Users, ShoppingBag, Globe, CheckCircle, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import heroImg from '@/assets/landing-hero.jpg';
import communityImg from '@/assets/landing-community.png';
import devicesImg from '@/assets/landing-devices.jpg';

const features = [
  { icon: Play, title: 'Médiathèque', desc: 'Partagez prédications, musique, podcasts et replays live avec votre communauté.' },
  { icon: Heart, title: 'Collecte de fonds', desc: 'Lancez des campagnes de dons avec suivi en temps réel et intégration Paystack.' },
  { icon: ShoppingBag, title: 'Boutique digitale', desc: 'Vendez ebooks, formations et ressources à votre congrégation dans le monde entier.' },
  { icon: Users, title: 'Gestion communautaire', desc: 'Gérez membres, rôles et affiliés depuis un seul tableau de bord.' },
  { icon: Globe, title: 'Multi-organisations', desc: 'Hébergez des centaines d\'églises et ministères sur une seule plateforme.' },
  { icon: Zap, title: 'Programme d\'affiliation', desc: 'Permettez à vos membres de gagner en promouvant vos produits et campagnes.' },
];

const stats = [
  { value: '10 000+', label: 'Membres' },
  { value: '500+', label: 'Communautés' },
  { value: '2M XOF', label: 'Dons collectés' },
  { value: 'CI', label: 'Basé en Côte d\'Ivoire' },
];

const plans = [
  { name: 'Gratuit', price: '0 XOF', features: ['Page communautaire', 'Médiathèque', 'Dons basiques'] },
  { name: 'Pro', price: '15 000 XOF/mois', features: ['Tout le plan Gratuit', 'Boutique digitale', 'Programme d\'affiliation'], highlight: true },
  { name: 'Entreprise', price: 'Sur mesure', features: ['Tout le plan Pro', 'Domaine personnalisé', 'Support prioritaire'] },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <span className="text-xl font-extrabold tracking-tight italic text-gold">Siteviral</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/about">À propos</Link></Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Connexion</Button>
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground border-0 shadow-gold"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Commencer
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-14 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        <div className="relative z-10 container max-w-5xl px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
              🌍 Conçu pour les communautés de foi africaines
            </Badge>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Développez votre communauté.{' '}
              <span className="text-gold font-extrabold italic">
                Multipliez votre impact.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Siteviral est la plateforme tout-en-un pour les églises, ministères et leaders de foi
              pour partager du contenu, collecter des fonds, vendre des ressources et développer leur communauté — en commençant par la Côte d'Ivoire.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="gold-gradient text-primary-foreground border-0 shadow-gold px-8 gap-2 h-12 w-full sm:w-auto"
                onClick={() => navigate('/auth?tab=signup')}
              >
                Commencer gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 gap-2 w-full sm:w-auto"
                onClick={() => navigate('/discover')}
              >
                <Play className="h-4 w-4" /> Découvrir les communautés
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14 rounded-2xl border border-border/60 overflow-hidden shadow-elevated glass p-6 sm:p-10"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Community image section */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Connectez vos membres,{' '}
                <span className="text-gold italic">partout dans le monde.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Que votre communauté soit à Abidjan, Paris ou New York, Siteviral vous permet de rester
                connectés. Partagez des moments forts, diffusez vos prédications et gardez le lien avec chaque membre.
              </p>
              <Button
                className="gold-gradient text-primary-foreground border-0 shadow-gold gap-2"
                onClick={() => navigate('/auth?tab=signup')}
              >
                Rejoignez-nous <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl overflow-hidden shadow-elevated border border-border/40"
            >
              <img src={communityImg} alt="Communauté unie" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Tout ce dont votre communauté a besoin</h2>
            <p className="text-muted-foreground">Une plateforme. Des possibilités infinies.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-3"
              >
                <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center shadow-gold">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Devices / mobile section */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-elevated border border-border/40"
            >
              <img src={devicesImg} alt="Accessible sur tous les appareils" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="order-1 md:order-2"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Accessible sur{' '}
                <span className="text-gold italic">tous vos appareils.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Application installable directement depuis votre navigateur. Pas besoin de télécharger sur un store.
                Consultez le contenu hors-ligne, recevez des notifications et restez connectés.
              </p>
              <ul className="space-y-2">
                {['Application installable (PWA)', 'Fonctionne hors-ligne', 'Notifications push'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Commencez gratuitement. Évoluez selon vos besoins.</h2>
          <p className="text-muted-foreground mb-8">
            Le plan gratuit inclut une page communautaire complète, une médiathèque et les dons basiques.
            Passez au plan Pro pour la boutique, les affiliés et bien plus.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-5 border text-left ${plan.highlight ? 'border-primary bg-primary/5 shadow-gold' : 'border-border bg-card shadow-card'}`}
              >
                <h3 className="font-bold text-base">{plan.name}</h3>
                <div className={`text-xl font-bold mt-1 ${plan.highlight ? 'text-primary' : ''}`}>{plan.price}</div>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Security */}
      <section className="py-16 px-4">
        <div className="container max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Sécurité et confiance</h2>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Vos données sont protégées par un chiffrement de bout en bout. Les paiements sont sécurisés via Paystack,
            leader des paiements en Afrique. Conformité RGPD et lois ivoiriennes.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl text-center">
          <div className="bg-card rounded-3xl border border-primary/20 p-8 sm:p-10 shadow-elevated space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold">Prêt à connecter votre communauté ?</h2>
            <p className="text-muted-foreground">Rejoignez des centaines de communautés de foi déjà sur Siteviral.</p>
            <Button
              size="lg"
              className="gold-gradient text-primary-foreground border-0 shadow-gold px-10 h-12 gap-2 w-full sm:w-auto"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Créez votre communauté <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20">
        <div className="container px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-3">
              <span className="text-xl font-extrabold italic text-gold">Siteviral</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plateforme tout-en-un pour les communautés de foi en Afrique.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/discover" className="hover:text-foreground transition-colors">Découvrir</Link></li>
                <li><Link to="/auth?tab=signup" className="hover:text-foreground transition-colors">Créer une communauté</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Connexion</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Conditions d'utilisation</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/about" className="hover:text-foreground transition-colors">À propos</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Abidjan, Côte d'Ivoire</li>
                <li>contact@siteviral.com</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Siteviral. Tous droits réservés.</span>
            <span>Fait avec ❤️ pour les communautés de foi en Côte d'Ivoire</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
