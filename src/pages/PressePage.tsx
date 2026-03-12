import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Mail, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const pressStats = [
  { value: '10 000+', label: 'Organisations actives' },
  { value: '25+', label: 'Pays couverts' },
  { value: '93%', label: 'Revenu reversé aux créateurs' },
  { value: '0 FCFA', label: 'Abonnement' },
];

const pressFeatures = [
  {
    title: 'Plateforme tout-en-un',
    desc: 'Vente de produits numériques, collecte de dons, gestion communautaire et programme ambassadeur — une seule plateforme.',
  },
  {
    title: 'Mobile Money natif',
    desc: 'Première plateforme à intégrer nativement Orange Money, MTN, Wave et Airtel pour la vente de contenus numériques.',
  },
  {
    title: 'Commission la plus basse',
    desc: '7% tout inclus — moins que Gumroad (10%), Shopify (2.9% + abonnement), Patreon (8-12%).',
  },
  {
    title: 'Programme ambassadeur',
    desc: 'Système d\'affiliation unique qui transforme les acheteurs en promoteurs. Marketing viral sans budget publicitaire.',
  },
];

const pressTimeline = [
  { year: '2024', event: 'Fondation de Siteviral. Premières organisations pilotes.' },
  { year: '2025', event: 'Lancement public. Intégration Paystack + Stripe. 1 000 organisations.' },
  { year: '2026', event: 'Expansion panafricaine. 10 000+ organisations. Programme partenaire B2B.' },
];

export default function PressePage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Presse — Siteviral | Plateforme de monétisation pour créateurs africains"
        description="Kit presse, chiffres clés et informations pour journalistes et médias sur Siteviral, la plateforme de monétisation #1 pour les créateurs africains."
        canonicalUrl="https://siteviral.com/presse"
      />
      <LandingNav />

      {/* Hero */}
      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-16 sm:pt-32 text-center space-y-6">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border">
            📰 Espace Presse
          </Badge>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Siteviral dans <span className="text-primary">les médias</span>
          </motion.h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ressources, chiffres clés et contacts pour les journalistes et partenaires médias.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container max-w-4xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {pressStats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-8">
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">À propos de Siteviral</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
                <p>
                  <strong className="text-foreground">Siteviral</strong> est la première plateforme de monétisation de contenu numérique 
                  conçue pour l'Afrique. Elle permet aux créateurs, organisations religieuses, ONG, 
                  formateurs et entrepreneurs de vendre des produits numériques, collecter des dons et développer 
                  leur communauté — avec paiement Mobile Money natif, en français et en anglais.
                </p>
                <p>
                  Fondée sur le constat que les plateformes occidentales (Shopify, Gumroad, Patreon) ne sont pas 
                  adaptées au marché africain — pas de Mobile Money, abonnements en dollars, interfaces en anglais — 
                  Siteviral propose une alternative locale, accessible et performante.
                </p>
                <p>
                  Le modèle économique est simple : <strong className="text-foreground">zéro abonnement, 7% de commission par vente</strong>. 
                  Les créateurs conservent 93% de leurs revenus. Le programme ambassadeur permet une croissance virale 
                  sans budget publicitaire.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-5">
              {pressFeatures.map(f => (
                <div key={f.title} className="p-5 rounded-2xl border border-border bg-card">
                  <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-extrabold mb-10 text-center">Chronologie</h2>
          <div className="space-y-6">
            {pressTimeline.map(t => (
              <div key={t.year} className="flex gap-5 items-start">
                <div className="w-16 shrink-0 text-right">
                  <span className="font-extrabold text-primary">{t.year}</span>
                </div>
                <div className="w-px bg-border shrink-0" />
                <p className="text-sm text-muted-foreground pt-0.5">{t.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kit presse */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl text-center space-y-8">
          <h2 className="text-2xl font-extrabold">Kit Presse</h2>
          <p className="text-muted-foreground text-sm">
            Téléchargez nos ressources : logo, captures d'écran, présentation et chiffres clés.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 px-8 h-13" onClick={() => window.open('/logo-s.png', '_blank')}>
              <Download className="h-4 w-4" /> Logo Siteviral
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 h-13" onClick={() => window.open('/Present-marktg-SITEVIRAL.pdf', '_blank')}>
              <ExternalLink className="h-4 w-4" /> Présentation PDF
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Contact Presse</h2>
          <p className="text-primary-foreground/80">
            Pour toute demande d'interview, de partenariat ou d'information complémentaire.
          </p>
          <Button size="lg" variant="secondary" className="px-8 h-13 text-base gap-2 group" onClick={() => window.location.href = '/contact'}>
            <Mail className="h-4 w-4" /> Nous contacter <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
