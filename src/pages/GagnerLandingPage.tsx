import { useNavigate } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, Wallet, Users, CheckCircle, Zap, TrendingUp, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';

const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

const steps = [
  { icon: Share2, title: 'Choisis un produit', desc: 'Parcours la marketplace et sélectionne ce qui te plaît.' },
  { icon: MessageCircle, title: 'Partage sur WhatsApp', desc: 'Envoie ton lien à tes contacts en un clic.' },
  { icon: Wallet, title: 'Encaisse ta commission', desc: '5 à 50% sur chaque vente. Mobile Money ou virement.' },
];

const benefits = [
  { icon: Zap, label: 'Zéro contenu à créer' },
  { icon: TrendingUp, label: 'Commissions de 5 à 50%' },
  { icon: Users, label: 'Rejoins +1 000 ambassadeurs' },
  { icon: CheckCircle, label: 'Retraits Mobile Money & Bank' },
];

const testimonials = [
  { name: 'Awa D.', role: 'Ambassadrice', text: 'J\'ai gagné 25 000 FCFA en une semaine juste en partageant sur WhatsApp.', flag: '🇸🇳' },
  { name: 'Kevin M.', role: 'Ambassadeur', text: 'Pas besoin de créer du contenu. Je partage et je touche ma commission.', flag: '🇨🇲' },
  { name: 'Fatou B.', role: 'Ambassadrice', text: 'L\'inscription prend 2 minutes. Mon premier partage a généré une vente le jour même.', flag: '🇨🇮' },
];

export default function GagnerLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Gagner de l'argent en partageant — Siteviral"
        description="Deviens ambassadeur Siteviral. Partage des produits numériques et gagne 5-50% de commission sur chaque vente. Zéro contenu à créer."
        canonicalUrl="https://siteviral.com/gagner"
        keywords="gagner argent partageant, ambassadeur, commission, mobile money, WhatsApp"
      />
      <LandingNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full mb-6">
              <Share2 className="h-3.5 w-3.5" /> Programme Ambassadeur
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] mb-4">
              Gagne de l'argent<br />
              <span className="text-accent">en partageant.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-8">
              Zéro contenu à créer. Choisis un produit, partage ton lien WhatsApp, touche ta commission.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-sm" onClick={() => navigate('/auth?mode=signup&intent=ambassador')}>
                💰 Commencer à gagner <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-sm" onClick={() => navigate('/marketplace')}>
                Explorer la marketplace
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">First win en 60 secondes · Inscription gratuite</p>
          </motion.div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="border-y border-border bg-muted/30 py-6 px-4">
        <div className="container max-w-3xl flex flex-wrap justify-center gap-6">
          {benefits.map(b => (
            <div key={b.label} className="flex items-center gap-2 text-sm font-medium">
              <b.icon className="h-4 w-4 text-accent shrink-0" />
              {b.label}
            </div>
          ))}
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-16 px-4">
        <div className="container max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-10">Comment tu gagnes en 3 étapes</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl border border-border bg-card"
              >
                <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-accent" />
                </div>
                <p className="text-xs font-bold text-accent mb-1">Étape {i + 1}</p>
                <h3 className="font-bold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-4 bg-muted/20">
        <div className="container max-w-3xl">
          <h2 className="text-xl font-extrabold text-center mb-8">Ils gagnent déjà avec Siteviral</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-card">
                <p className="text-sm text-foreground mb-3">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.flag}</span>
                  <div>
                    <p className="text-xs font-bold">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center">
        <div className="container max-w-md">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-3">Ta 1ère vente peut tomber aujourd'hui</h2>
          <p className="text-sm text-muted-foreground mb-6">Inscris-toi, choisis un produit, partage. C'est tout.</p>
          <Button size="lg" className="gap-2" onClick={() => navigate('/auth?mode=signup&intent=ambassador')}>
            💰 Je veux gagner <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Suspense fallback={null}>
        <LandingFooterCompact />
      </Suspense>
    </div>
  );
}
