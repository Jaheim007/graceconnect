import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Mail, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { useNavigate } from 'react-router-dom';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function PressePage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const pressStats = [
    { value: '10 000+', label: isFr ? 'Organisations actives' : 'Active organizations' },
    { value: '25+', label: isFr ? 'Pays couverts' : 'Countries covered' },
    { value: '93%', label: isFr ? 'Revenu reversé aux créateurs' : 'Revenue kept by creators' },
    { value: '0 FCFA', label: isFr ? 'Abonnement' : 'Subscription' },
  ];

  const pressFeatures = [
    { title: isFr ? 'Plateforme tout-en-un' : 'All-in-one platform', desc: isFr ? 'Vente de produits numériques, collecte de dons, gestion communautaire et programme ambassadeur — une seule plateforme.' : 'Digital product sales, donation collection, community management and ambassador program — one platform.' },
    { title: isFr ? 'Mobile Money natif' : 'Native Mobile Money', desc: isFr ? 'Première plateforme à intégrer nativement Orange Money, MTN, Wave et Airtel pour la vente de contenus numériques.' : 'First platform to natively integrate Orange Money, MTN, Wave and Airtel for digital content sales.' },
    { title: isFr ? 'Commission la plus basse' : 'Lowest commission', desc: isFr ? '7% tout inclus — moins que Gumroad (10%), Shopify (2.9% + abonnement), Patreon (8-12%).' : '7% all-inclusive — less than Gumroad (10%), Shopify (2.9% + subscription), Patreon (8-12%).' },
    { title: isFr ? 'Programme ambassadeur' : 'Ambassador program', desc: isFr ? 'Système d\'affiliation unique qui transforme les acheteurs en promoteurs. Marketing viral sans budget publicitaire.' : 'Unique affiliate system that turns buyers into promoters. Viral marketing without ad budget.' },
  ];

  const pressTimeline = [
    { year: '2024', event: isFr ? 'Fondation de Siteviral. Premières organisations pilotes.' : 'Siteviral founded. First pilot organizations.' },
    { year: '2025', event: isFr ? 'Lancement public. Intégration Paystack + Stripe. 1 000 organisations.' : 'Public launch. Paystack + Stripe integration. 1,000 organizations.' },
    { year: '2026', event: isFr ? 'Expansion panafricaine. 10 000+ organisations. Programme partenaire B2B.' : 'Pan-African expansion. 10,000+ organizations. B2B partner program.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={isFr ? 'Presse — Siteviral' : 'Press — Siteviral'} description={isFr ? 'Kit presse, chiffres clés et informations pour journalistes.' : 'Press kit, key figures and information for journalists.'} canonicalUrl="https://siteviral.com/presse" />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-16 sm:pt-32 text-center space-y-6">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border">{isFr ? '📰 Espace Presse' : '📰 Press Room'}</Badge>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-5xl font-extrabold leading-tight">
            {isFr ? <>Siteviral dans <span className="text-primary">les médias</span></> : <>Siteviral in <span className="text-primary">the media</span></>}
          </motion.h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{isFr ? 'Ressources, chiffres clés et contacts pour les journalistes et partenaires médias.' : 'Resources, key figures and contacts for journalists and media partners.'}</p>
        </div>
      </section>

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

      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-8">
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">{isFr ? 'À propos de Siteviral' : 'About Siteviral'}</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
                <p><strong className="text-foreground">Siteviral</strong> {isFr ? 'est la première plateforme de monétisation de contenu numérique conçue pour l\'Afrique. Elle permet aux créateurs, organisations religieuses, ONG, formateurs et entrepreneurs de vendre des produits numériques, collecter des dons et développer leur communauté — avec paiement Mobile Money natif.' : 'is the first digital content monetization platform designed for Africa. It enables creators, religious organizations, NGOs, trainers and entrepreneurs to sell digital products, collect donations and grow their community — with native Mobile Money payments.'}</p>
                <p>{isFr ? 'Le modèle économique est simple : zéro abonnement, 7% de commission par vente. Les créateurs conservent 93% de leurs revenus.' : 'The business model is simple: zero subscription, 7% commission per sale. Creators keep 93% of their revenue.'}</p>
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

      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-extrabold mb-10 text-center">{isFr ? 'Chronologie' : 'Timeline'}</h2>
          <div className="space-y-6">
            {pressTimeline.map(t => (
              <div key={t.year} className="flex gap-5 items-start">
                <div className="w-16 shrink-0 text-right"><span className="font-extrabold text-primary">{t.year}</span></div>
                <div className="w-px bg-border shrink-0" />
                <p className="text-sm text-muted-foreground pt-0.5">{t.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container max-w-3xl text-center space-y-8">
          <h2 className="text-2xl font-extrabold">{isFr ? 'Kit Presse' : 'Press Kit'}</h2>
          <p className="text-muted-foreground text-sm">{isFr ? 'Téléchargez nos ressources : logo, captures d\'écran, présentation et chiffres clés.' : 'Download our resources: logo, screenshots, presentation and key figures.'}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 px-8 h-13" onClick={() => window.open('/logo-s.png', '_blank')}>
              <Download className="h-4 w-4" /> Logo Siteviral
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 h-13" onClick={() => window.open('/Present-marktg-SITEVIRAL.pdf', '_blank')}>
              <ExternalLink className="h-4 w-4" /> {isFr ? 'Présentation PDF' : 'PDF Presentation'}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">{isFr ? 'Contact Presse' : 'Press Contact'}</h2>
          <p className="text-primary-foreground/80">{isFr ? 'Pour toute demande d\'interview, de partenariat ou d\'information complémentaire.' : 'For any interview, partnership or additional information requests.'}</p>
          <Button size="lg" variant="secondary" className="px-8 h-13 text-base gap-2 group" onClick={() => navigate('/contact')}>
            <Mail className="h-4 w-4" /> {isFr ? 'Nous contacter' : 'Contact us'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
