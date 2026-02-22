import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  ArrowRight, Play, Heart, Users, ShoppingBag, Globe,
  CheckCircle, Zap, Shield, Sun, Moon, Star, Quote,
  Smartphone, BarChart3, BookOpen, Megaphone, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import heroImg from '@/assets/landing-hero.jpg';
import communityImg from '@/assets/landing-community.png';
import devicesImg from '@/assets/landing-devices.jpg';

/* ─── Animated counter hook ─── */
function useCounter(target: number, duration = 2) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, target, duration]);

  return { ref, value };
}

function AnimatedStat({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, value } = useCounter(target);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-extrabold text-gold tabular-nums">
        {value.toLocaleString('fr-FR')}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ─── Data ─── */
const features = [
  { icon: Play, title: 'Médiathèque', desc: 'Partagez vidéos, musique, podcasts et replays live avec votre communauté.', color: 'from-red-500/20 to-orange-500/20' },
  { icon: Heart, title: 'Collecte de fonds', desc: 'Lancez des campagnes de dons avec suivi en temps réel et intégration Paystack.', color: 'from-pink-500/20 to-red-500/20' },
  { icon: ShoppingBag, title: 'Boutique digitale', desc: 'Vendez ebooks, formations et ressources à votre audience dans le monde entier.', color: 'from-violet-500/20 to-purple-500/20' },
  { icon: Users, title: 'Gestion communautaire', desc: 'Gérez membres, rôles et affiliés depuis un seul tableau de bord.', color: 'from-blue-500/20 to-cyan-500/20' },
  { icon: BarChart3, title: 'Analytics avancés', desc: 'Suivez vos performances avec des métriques détaillées : revenus, membres, engagement.', color: 'from-emerald-500/20 to-green-500/20' },
  { icon: Zap, title: 'Programme d\'affiliation', desc: 'Permettez à vos membres de gagner en promouvant vos produits et campagnes.', color: 'from-amber-500/20 to-yellow-500/20' },
];

const testimonials = [
  { name: 'Pasteur Kouadio', role: 'Église Grâce Divine, Abidjan', text: 'Siteviral a transformé notre manière de toucher nos fidèles. Les dons en ligne ont augmenté de 300% en 3 mois.', rating: 5 },
  { name: 'Marie-Claire Bamba', role: 'ONG Espoir Jeunesse', text: 'La boutique digitale nous permet de vendre nos formations partout en Afrique. C\'est un game-changer pour notre ONG.', rating: 5 },
  { name: 'Ibrahim Traoré', role: 'Association Culturelle Djidji', text: 'En une semaine, nous avions notre page communautaire, notre médiathèque et nos premiers membres actifs. Incroyable !', rating: 5 },
];

const steps = [
  { num: '01', title: 'Créez votre compte', desc: 'Inscription gratuite en 30 secondes avec Google ou email.', icon: Smartphone },
  { num: '02', title: 'Lancez votre communauté', desc: 'Configurez votre page, ajoutez du contenu et invitez vos membres.', icon: Globe },
  { num: '03', title: 'Monétisez et grandissez', desc: 'Vendez des ressources, collectez des dons et suivez vos résultats.', icon: BarChart3 },
];

const plans = [
  { name: 'Gratuit', price: '0', currency: 'XOF', period: '', features: ['Page communautaire', 'Médiathèque', 'Dons basiques', 'Jusqu\'à 100 membres'], cta: 'Commencer' },
  { name: 'Pro', price: '15 000', currency: 'XOF', period: '/mois', features: ['Tout le plan Gratuit', 'Boutique digitale', 'Programme d\'affiliation', 'Analytics avancés', 'Membres illimités'], highlight: true, cta: 'Essai gratuit' },
  { name: 'Entreprise', price: 'Sur mesure', currency: '', period: '', features: ['Tout le plan Pro', 'Domaine personnalisé', 'Support prioritaire', 'API & intégrations', 'SLA garanti'], cta: 'Nous contacter' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Nav ─── */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <span className="text-xl font-extrabold tracking-tight italic text-gold">Siteviral</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/discover">Explorer</Link></Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/about">À propos</Link></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-xs sm:text-sm px-2 sm:px-3">Connexion</Button>
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground border-0 shadow-gold text-xs sm:text-sm px-3 sm:px-4"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Commencer
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
        </div>

        <div className="relative z-10 container max-w-5xl px-4 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center space-y-7"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary gap-1.5">
                <Zap className="h-3 w-3" />
                Conçu pour les leaders et organisations en Afrique
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Développez votre
              <br />
              communauté.{' '}
              <span className="text-gold italic relative">
                Multipliez votre impact.
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 gold-gradient rounded-full"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              La plateforme tout-en-un pour partager du contenu, collecter des fonds,
              vendre des ressources et développer votre communauté.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="gold-gradient text-primary-foreground border-0 shadow-gold px-8 gap-2 h-13 text-base w-full sm:w-auto hover:scale-105 transition-transform"
                onClick={() => navigate('/auth?tab=signup')}
              >
                Commencer gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 gap-2 text-base w-full sm:w-auto hover:scale-105 transition-transform"
                onClick={() => navigate('/discover')}
              >
                <Play className="h-4 w-4" /> Découvrir les communautés
              </Button>
            </motion.div>

            {/* Social proof micro */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 pt-4">
              <div className="flex -space-x-2">
                {['K', 'M', 'A', 'S'].map((initial, i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-background gold-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                    {initial}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Rejoint par <span className="font-semibold text-foreground">500+</span> organisations
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Animated Stats ─── */}
      <section className="relative -mt-14 z-20 px-4">
        <div className="container max-w-4xl">
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-elevated glass p-6 sm:p-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <AnimatedStat target={10000} suffix="+" label="Membres actifs" />
              <AnimatedStat target={500} suffix="+" label="Communautés" />
              <AnimatedStat target={2} suffix="M" label="XOF collectés" />
              <AnimatedStat target={15} suffix="+" label="Pays représentés" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Comment ça marche</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Lancez-vous en <span className="text-gold italic">3 étapes simples</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.15 }}
                className="relative group"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />
                )}
                <div className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-card group-hover:shadow-elevated group-hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl gold-gradient flex items-center justify-center shadow-gold">
                      <s.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-4xl font-black text-muted-foreground/20">{s.num}</span>
                  </div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Community image section ─── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-6"
            >
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">Connectivité</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Connectez vos membres,{' '}
                <span className="text-gold italic">partout dans le monde.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                Que votre communauté soit à Abidjan, Paris ou New York, Siteviral vous permet de rester
                connectés. Partagez des moments forts, diffusez vos contenus et gardez le lien avec chaque membre.
              </p>
              <ul className="space-y-3">
                {['Diffusion en temps réel', 'Notifications push intelligentes', 'Contenu multimédia illimité'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="gold-gradient text-primary-foreground border-0 shadow-gold gap-2 h-11 px-6 hover:scale-105 transition-transform"
                onClick={() => navigate('/auth?tab=signup')}
              >
                Rejoignez-nous <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: 0.15 }}
              className="rounded-2xl overflow-hidden shadow-elevated border border-border/40 hover:scale-[1.02] transition-transform duration-500"
            >
              <img src={communityImg} alt="Communauté unie" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Fonctionnalités</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Tout ce dont votre communauté <span className="text-gold italic">a besoin</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">Une plateforme. Des possibilités infinies.</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 space-y-4"
              >
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Devices / PWA ─── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-elevated border border-border/40 hover:scale-[1.02] transition-transform duration-500"
            >
              <img src={devicesImg} alt="Accessible sur tous les appareils" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: 0.15 }}
              className="order-1 md:order-2 space-y-6"
            >
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">Application PWA</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Accessible sur{' '}
                <span className="text-gold italic">tous vos appareils.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                Application installable directement depuis votre navigateur. Pas besoin de télécharger sur un store.
              </p>
              <ul className="space-y-3">
                {[
                  { text: 'Application installable (PWA)', icon: Smartphone },
                  { text: 'Fonctionne hors-ligne', icon: Globe },
                  { text: 'Notifications push', icon: Megaphone },
                  { text: 'Temps de chargement ultra-rapide', icon: Zap },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-3 w-3 text-primary" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Témoignages</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Ils nous font <span className="text-gold italic">confiance</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 space-y-4 relative"
              >
                <Quote className="h-8 w-8 text-primary/15 absolute top-4 right-4" />
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="pt-2 border-t border-border/60">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Tarifs</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Commencez gratuitement. <span className="text-gold italic">Évoluez selon vos besoins.</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Le plan gratuit inclut tout pour démarrer. Passez au Pro quand vous êtes prêt à grandir.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-5"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`rounded-2xl p-6 border text-left transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'border-primary bg-primary/5 shadow-gold ring-1 ring-primary/20 relative'
                    : 'border-border bg-card shadow-card hover:shadow-elevated'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gold-gradient text-primary-foreground border-0 text-[10px] px-3">Populaire</Badge>
                  </div>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${plan.highlight ? 'text-gold' : ''}`}>{plan.price}</span>
                  {plan.currency && <span className="text-sm text-muted-foreground">{plan.currency}{plan.period}</span>}
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 h-11 ${
                    plan.highlight
                      ? 'gold-gradient text-primary-foreground border-0 shadow-gold'
                      : ''
                  }`}
                  variant={plan.highlight ? 'default' : 'outline'}
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  {plan.cta} <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Trust / Security ─── */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center space-y-4"
          >
            <div className="h-14 w-14 rounded-2xl gold-gradient flex items-center justify-center mx-auto shadow-gold">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Sécurité et confiance</h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Vos données sont protégées par un chiffrement de bout en bout. Les paiements sont sécurisés via Paystack,
              leader des paiements en Afrique. Conformité RGPD et lois ivoiriennes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              {['Chiffrement SSL', 'Paystack Certified', 'RGPD Conforme'].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 border border-border/60">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-4">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 gold-gradient opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />

            <div className="relative z-10 p-8 sm:p-14 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground leading-tight">
                Prêt à connecter votre communauté ?
              </h2>
              <p className="text-primary-foreground/80 max-w-md mx-auto">
                Rejoignez des centaines d'organisations déjà sur Siteviral et commencez à développer votre impact dès aujourd'hui.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 border-0 px-8 h-13 text-base gap-2 w-full sm:w-auto hover:scale-105 transition-transform shadow-elevated"
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  Créez votre communauté <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-13 px-8 text-base w-full sm:w-auto"
                  onClick={() => navigate('/discover')}
                >
                  Explorer d'abord
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/60 bg-muted/20">
        <div className="container px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="text-xl font-extrabold italic text-gold">Siteviral</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plateforme tout-en-un pour les leaders et organisations en Afrique.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/discover" className="hover:text-foreground transition-colors">Découvrir</Link></li>
                <li><Link to="/programs" className="hover:text-foreground transition-colors">Programmes</Link></li>
                <li><Link to="/auth?tab=signup" className="hover:text-foreground transition-colors">Créer une communauté</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Conditions d'utilisation</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/about" className="hover:text-foreground transition-colors">À propos</Link></li>
              </ul>
            </div>
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
            <span>Fait avec ❤️ en Côte d'Ivoire</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
