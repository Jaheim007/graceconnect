import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Users, Globe, Shield, Target, Zap, ArrowRight, Rocket, Eye, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LegalFooter } from '@/components/layout/LegalPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import communityImg from '@/assets/landing-community.png';
import heroImg from '@/assets/landing-hero.jpg';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="À propos de Siteviral — La plateforme digitale pour l'Afrique"
        description="Siteviral démocratise la monétisation numérique en Afrique. Créez votre plateforme, vendez, partagez et gagnez — sans compétences techniques, avec Mobile Money."
        canonicalUrl="https://siteviral.com/about"
        keywords="à propos Siteviral, plateforme digitale Afrique, monétisation numérique, vendre en ligne Afrique, Mobile Money"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Siteviral',
          url: 'https://siteviral.com',
          description: 'Plateforme d\'infrastructure digitale tout-en-un pour organisations, créateurs et ambassadeurs en Afrique et au-delà.',
          foundingDate: '2024',
        }}
      />

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/">
            <span className="text-xl font-extrabold tracking-tight text-foreground">Siteviral</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/auth">Se connecter</Link></Button>
            <Button size="sm" asChild><Link to="/auth?tab=signup">Commencer</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
        </div>
        <div className="relative z-10 container max-w-4xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-5">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full font-semibold">Notre mission</Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Donner à chacun le pouvoir de{' '}
              <span className="text-primary">monétiser son savoir</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Siteviral est né d'un constat simple : en Afrique, des millions de créateurs, leaders et organisations ont du contenu précieux mais aucune infrastructure pour le monétiser. Nous changeons ça.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Le problème qu'on résout */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Badge variant="secondary" className="mb-4 text-xs">Le problème</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
                Du contenu <span className="text-primary">dispersé et non monétisé</span>
              </h2>
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>Des pasteurs enregistrent des prédications qui ne sont jamais rééditées. Des coachs créent des documents de formation qui dorment sur un disque dur. Des ONG collectent des dons par des moyens artisanaux.</p>
                <p>Le contenu est là. Les compétences sont là. Ce qui manque, c'est <strong className="text-foreground">l'infrastructure</strong> — une plateforme simple qui permet de centraliser, monétiser et distribuer.</p>
                <p>Et pour ceux qui n'ont aucun contenu ? Ils peuvent gagner en <strong className="text-foreground">partageant celui des autres</strong>. C'est le Programme Ambassadeur.</p>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden shadow-elevated border border-border/40">
              <img src={communityImg} alt="Community" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Notre solution */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs">Notre solution</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Une plateforme. <span className="text-primary">Trois façons de réussir.</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Target, title: '🏢 Organisations', desc: 'Créez votre plateforme digitale complète : boutique, dons, communauté, ambassadeurs. Zéro abonnement.', items: ['Boutique numérique', 'Collecte de dons', 'Gestion communautaire'] },
              { icon: Rocket, title: '🚀 Ambassadeurs', desc: 'Zéro contenu à créer. Partagez les ressources des autres et touchez 5% à 50% de commission.', items: ['Lien unique', 'Commission automatique', 'Retrait Mobile Money'] },
              { icon: Eye, title: '🛒 Acheteurs', desc: 'Accédez à des milliers de ressources : e-books, formations, audio, vidéos. Paiement Mobile Money.', items: ['Accès instantané', 'Bibliothèque personnelle', 'Paiement sécurisé'] },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-bold text-base">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.items.map((li, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-foreground/80">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" /> {li}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos valeurs */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Nos <span className="text-primary">valeurs</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart, title: 'Impact social', desc: 'Chaque fonctionnalité est pensée pour créer un impact réel dans la vie des utilisateurs.' },
              { icon: Users, title: 'Communauté', desc: 'Nous croyons que la force collective multiplie les résultats individuels.' },
              { icon: Shield, title: 'Confiance', desc: 'Paiements sécurisés, watermarking, KYC — la confiance est notre fondation.' },
              { icon: Globe, title: 'Accessibilité', desc: 'Mobile Money, langues locales, interface intuitive — accessible à tous, partout.' },
            ].map((v, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.06 }}
                className="bg-card rounded-2xl border border-border p-5 space-y-3 text-center">
                <div className="h-10 w-10 mx-auto rounded-xl bg-primary flex items-center justify-center">
                  <v.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-sm">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '8+', label: 'Pays actifs' },
              { value: '1 200+', label: 'Créateurs' },
              { value: '15 000+', label: 'Ressources vendues' },
              { value: '0 FCFA', label: 'Abonnement' },
            ].map((stat, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.06 }}>
                <p className="text-2xl sm:text-3xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl text-center">
          <div className="bg-card rounded-3xl border border-primary/20 p-8 sm:p-10 shadow-elevated space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à <span className="text-primary">transformer votre impact ?</span></h2>
            <p className="text-muted-foreground text-sm">Que vous soyez créateur, leader ou simplement quelqu'un qui veut gagner en partageant — Siteviral est fait pour vous.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="px-10 h-12 gap-2 w-full sm:w-auto cta-glow" asChild>
                <Link to="/auth?tab=signup">Créer mon compte gratuit <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto" asChild>
                <Link to="/ambassador">Devenir ambassadeur</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
