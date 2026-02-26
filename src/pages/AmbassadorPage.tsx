import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, DollarSign, Share2, Users, Zap, Star, TrendingUp, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { useState } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const steps = [
  { icon: Users, title: 'Inscrivez-vous gratuitement', desc: 'Créez votre compte en 30 secondes. Aucune compétence technique requise.' },
  { icon: Share2, title: 'Choisissez & partagez', desc: 'Parcourez les ressources disponibles. Copiez votre lien unique et partagez-le sur WhatsApp, Facebook, etc.' },
  { icon: DollarSign, title: 'Gagnez des commissions', desc: 'Chaque achat via votre lien vous rapporte de 5% à 50% de commission. Retrait automatique.' },
];

const testimonials = [
  { name: 'Ibrahim T.', flag: '🇸🇳', text: 'Je n\'ai aucun contenu. Je partage simplement et je gagne chaque semaine. C\'est incroyable.', earning: '120 000 FCFA/mois' },
  { name: 'Amara D.', flag: '🇨🇮', text: 'En 2 mois, j\'ai gagné plus qu\'un salaire mensuel juste en partageant des ressources numériques.', earning: '250 000 FCFA/mois' },
  { name: 'Sophie N.', flag: '🇧🇯', text: 'Je partage des prédications audio sur WhatsApp. Les commissions tombent toutes seules.', earning: '85 000 FCFA/mois' },
];

const faqs = [
  { q: 'Dois-je payer pour devenir ambassadeur ?', a: 'Non, c\'est 100% gratuit. Pas de frais d\'inscription, pas d\'abonnement.' },
  { q: 'Comment suis-je payé ?', a: 'Vos commissions sont automatiquement calculées. Vous pouvez retirer via Mobile Money, virement bancaire ou carte selon votre pays, dès que votre solde atteint le minimum.' },
  { q: 'Quel pourcentage de commission ?', a: 'C\'est chaque organisation qui fixe le taux de commission sur ses produits, entre 5% et 50%. Le taux est affiché clairement sur chaque produit.' },
  { q: 'Est-ce que je gagne des commissions sur les dons et campagnes ?', a: 'Non. Les commissions ambassadeurs s\'appliquent exclusivement aux ventes de ressources numériques (ebooks, audio, vidéos, etc.). Aucune commission n\'est versée sur les dons, offrandes ou campagnes de collecte.' },
  { q: 'Dois-je créer du contenu ?', a: 'Non ! Vous partagez le contenu des autres. Zéro création nécessaire. Sauf si vous souhaitez aussi créer votre propre plateforme.' },
  { q: 'Combien puis-je gagner ?', a: 'Il n\'y a pas de limite. Certains ambassadeurs gagnent plus de 500 000 FCFA/mois en partageant activement.' },
];

export default function AmbassadorPage() {
  const navigate = useNavigate();
  const [shares, setShares] = useState(5);
  const avgPrice = 3000;
  const convRate = 0.08;
  const commissionRate = 0.15;
  const estimatedMonthly = Math.round(shares * 30 * avgPrice * convRate * commissionRate);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Devenir Ambassadeur — Gagnez de l'argent en partageant du contenu | Siteviral"
        description="Zéro contenu à créer. Partagez des produits numériques (ebooks, audio, vidéos) et gagnez jusqu'à 50% de commission sur chaque vente. Inscription 100% gratuite."
        canonicalUrl="https://siteviral.com/ambassador"
        keywords="devenir ambassadeur, gagner argent en partageant, programme ambassadeur produits numériques, commission Mobile Money, revenu passif Afrique, partager et gagner, ambassadeur digital"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Programme Ambassadeur Siteviral',
          description: 'Gagnez de l\'argent en partageant du contenu numérique. Commission de 5% à 50%.',
          url: 'https://siteviral.com/ambassador',
        }}
      />
      <LandingNav />

      {/* Hero */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="relative z-10 container max-w-4xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full gap-1.5 font-semibold">
                🚀 Programme Ambassadeur
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Zéro contenu à créer.{' '}
              <span className="text-primary">Juste partager et gagner.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Sur Siteviral, tout le monde gagne — même sans contenu. Partagez les ressources des organisations et leaders, et touchez de <strong className="text-foreground">5% à 50% de commission</strong> sur chaque vente de ressource.
            </motion.p>
            <motion.p variants={fadeUp} className="text-xs text-muted-foreground/80 italic max-w-xl mx-auto">
              ⚠️ Les commissions s'appliquent uniquement aux ventes de ressources numériques. Aucune commission sur les dons et campagnes.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="px-8 gap-2 h-13 text-base w-full sm:w-auto cta-glow" onClick={() => navigate('/auth?mode=signup')}>
                Commencer gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-13 px-8 text-base w-full sm:w-auto" onClick={() => document.getElementById('how-ambassador')?.scrollIntoView({ behavior: 'smooth' })}>
                Comment ça marche ?
              </Button>
            </motion.div>
            <motion.p variants={fadeUp} className="text-[11px] text-muted-foreground/60">
              ✓ 100% gratuit · ✓ Pas de carte requise · ✓ Retrait flexible
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-ambassador" className="py-20 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold">3 étapes. <span className="text-primary">C'est tout.</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 text-center space-y-4 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Simulator */}
      <section className="py-20 px-4">
        <div className="container max-w-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Simulez <span className="text-primary">vos gains</span></h2>
            <p className="text-sm text-muted-foreground mt-2">Déplacez le curseur pour voir combien vous pourriez gagner</p>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Partages par jour</span>
                <span className="font-bold text-primary">{shares}</span>
              </div>
              <input
                type="range" min={1} max={50} value={shares}
                onChange={e => setShares(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-full"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>1</span><span>25</span><span>50</span>
              </div>
            </div>
            <div className="text-center py-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">Estimation mensuelle</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary mt-1">
                {estimatedMonthly.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Basé sur un prix moyen de {avgPrice.toLocaleString()} FCFA, {Math.round(convRate * 100)}% de conversion, {Math.round(commissionRate * 100)}% de commission
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ils gagnent déjà <span className="text-primary">avec Siteviral</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">{t.flag} {t.name}</p>
                  <Badge variant="secondary" className="text-[10px]">{t.earning}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Pourquoi <span className="text-primary">devenir ambassadeur ?</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Gift, title: '100% gratuit', desc: 'Pas d\'inscription payante, pas de frais cachés' },
              { icon: Zap, title: 'Aucun contenu à créer', desc: 'Vous partagez le contenu des autres et gagnez' },
              { icon: TrendingUp, title: 'Jusqu\'à 50% de commission', desc: 'Les taux les plus élevés du marché' },
              { icon: DollarSign, title: 'Retrait flexible', desc: 'Mobile Money, virement bancaire ou carte — selon votre pays' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10">Questions <span className="text-primary">fréquentes</span></h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-card rounded-xl border border-border p-4">
                <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-xl text-center">
          <div className="bg-card rounded-3xl border border-primary/20 p-8 sm:p-10 shadow-elevated space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à gagner de l'argent <span className="text-primary">sans créer de contenu ?</span></h2>
            <p className="text-muted-foreground text-sm">Rejoignez des centaines d'ambassadeurs qui gagnent déjà avec Siteviral.</p>
            <Button size="lg" className="px-10 h-13 gap-2 text-base cta-glow" onClick={() => navigate('/auth?mode=signup')}>
              Devenir ambassadeur maintenant <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-[11px] text-muted-foreground/60">Inscription en 30 secondes · 100% gratuit</p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
