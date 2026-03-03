import { useNavigate } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, ShoppingBag, Users, BarChart3, Shield, Wallet, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';

const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

const features = [
  { icon: ShoppingBag, title: 'Boutique digitale', desc: 'Vends eBooks, PDFs, cours, audio, vidéos. Paiement Mobile Money & carte.' },
  { icon: Users, title: 'Armée d\'ambassadeurs', desc: 'Active l\'affiliation et laisse des milliers de personnes vendre pour toi.' },
  { icon: Heart, title: 'Campagnes de dons', desc: 'Collecte des fonds pour tes projets et causes. Suivi en temps réel.' },
  { icon: BarChart3, title: 'Analytics puissants', desc: 'Ventes, clics, conversions, CRM. Tout dans un seul tableau de bord.' },
  { icon: Shield, title: 'KYC & conformité', desc: 'Vérification intégrée. Retraits sécurisés après validation.' },
  { icon: Wallet, title: 'Retraits faciles', desc: 'Mobile Money, virement bancaire. Pas de minimum bloquant.' },
];

const steps = [
  { num: '1', title: 'Crée ton centre digital', desc: 'Logo, description, premiers contenus.' },
  { num: '2', title: 'Ajoute tes produits', desc: 'Upload tes eBooks, cours, vidéos.' },
  { num: '3', title: 'Active tes ambassadeurs', desc: 'Ils partagent, tu encaisses.' },
];

export default function VendreLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setMode } = useMode();

  const handleStart = () => {
    if (user) {
      setMode('creator');
      navigate('/create-org');
    } else {
      sessionStorage.setItem('sv_auth_intent', 'creator');
      navigate('/auth?intent=creator');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Vendez vos produits digitaux — Siteviral"
        description="Créez votre centre digital, vendez eBooks, cours, vidéos et activez une armée d'ambassadeurs qui vendent pour vous."
        canonicalUrl="https://siteviral.com/vendre"
        keywords="vendre ebook afrique, boutique digitale, créateur contenu, ambassadeurs, plateforme vente"
      />
      <LandingNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              <Building2 className="h-3.5 w-3.5" /> Espace Créateur
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] mb-4">
              Vendez plus grâce à<br />
              <span className="text-primary">une armée d'ambassadeurs.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-8">
              Créez votre centre digital en 10 minutes. Vos ambassadeurs partagent, vous encaissez.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-sm" onClick={handleStart}>
                🏢 Créer mon centre <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-sm" onClick={() => navigate('/marketplace')}>
                Voir la marketplace
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Crée ton centre digital en 10 minutes · Gratuit pour démarrer</p>
          </motion.div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-12 px-4 border-y border-border bg-muted/30">
        <div className="container max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-lg shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-0.5">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-10">Tout pour vendre en ligne</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <f.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center bg-muted/20">
        <div className="container max-w-md">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-3">Lance ta plateforme maintenant</h2>
          <p className="text-sm text-muted-foreground mb-6">Inscription gratuite. Commence à vendre en quelques minutes.</p>
          <Button size="lg" className="gap-2" onClick={handleStart}>
            🏢 Créer mon centre digital <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Suspense fallback={null}>
        <LandingFooterCompact />
      </Suspense>
    </div>
  );
}
