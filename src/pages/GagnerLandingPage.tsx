import { useNavigate } from 'react-router-dom';
import { LandingNav } from '@/components/landing/LandingNav';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, Wallet, Users, CheckCircle, Zap, TrendingUp, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';

const LandingFooterCompact = lazy(() => import('@/components/landing/LandingFooterCompact').then(m => ({ default: m.LandingFooterCompact })));

export default function GagnerLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const steps = [
    { icon: Share2, title: isFr ? 'Choisis un produit' : 'Pick a product', desc: isFr ? 'Parcours la marketplace et sélectionne ce qui te plaît.' : 'Browse the marketplace and select what you like.' },
    { icon: MessageCircle, title: isFr ? 'Partage sur WhatsApp' : 'Share on WhatsApp', desc: isFr ? 'Envoie ton lien à tes contacts en un clic.' : 'Send your link to your contacts in one click.' },
    { icon: Wallet, title: isFr ? 'Encaisse ta commission' : 'Collect your commission', desc: isFr ? '5 à 50% sur chaque vente. Mobile Money ou virement.' : '5-50% on each sale. Mobile Money or bank transfer.' },
  ];

  const benefits = [
    { icon: Zap, label: isFr ? 'Zéro contenu à créer' : 'Zero content to create' },
    { icon: TrendingUp, label: isFr ? 'Commissions de 5 à 50%' : '5-50% commissions' },
    { icon: Users, label: isFr ? 'Rejoins +1 000 ambassadeurs' : 'Join 1,000+ ambassadors' },
    { icon: CheckCircle, label: isFr ? 'Retraits Mobile Money & Bank' : 'Mobile Money & Bank withdrawals' },
  ];

  const testimonials = [
    { name: 'Awa D.', role: isFr ? 'Ambassadrice' : 'Ambassador', text: isFr ? 'J\'ai gagné 25 000 FCFA en une semaine juste en partageant sur WhatsApp.' : 'I earned 25,000 FCFA in one week just by sharing on WhatsApp.', flag: '🇸🇳' },
    { name: 'Kevin M.', role: isFr ? 'Ambassadeur' : 'Ambassador', text: isFr ? 'Pas besoin de créer du contenu. Je partage et je touche ma commission.' : 'No need to create content. I share and get my commission.', flag: '🇨🇲' },
    { name: 'Fatou B.', role: isFr ? 'Ambassadrice' : 'Ambassador', text: isFr ? 'L\'inscription prend 2 minutes. Mon premier partage a généré une vente le jour même.' : 'Sign-up takes 2 minutes. My first share generated a sale the same day.', flag: '🇨🇮' },
  ];

  const handleStart = () => {
    if (user) { navigate('/gagner'); } else {
      sessionStorage.setItem('sv_auth_intent', 'ambassador');
      navigate('/auth?intent=ambassador&redirect=/gagner');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Gagner de l\'argent en partageant — Siteviral' : 'Earn money by sharing — Siteviral'}
        description={isFr ? 'Deviens ambassadeur Siteviral. Partage des produits numériques et gagne 5-50% de commission.' : 'Become a Siteviral ambassador. Share digital products and earn 5-50% commission.'}
        canonicalUrl="https://siteviral.com/gagner"
      />
      <LandingNav />

      <section className="pt-24 pb-16 px-4">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full mb-6">
              <Share2 className="h-3.5 w-3.5" /> {isFr ? 'Programme Ambassadeur' : 'Ambassador Program'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.1] mb-4">
              {isFr ? <>Gagne de l'argent<br /><span className="text-accent">en partageant.</span></> : <>Earn money<br /><span className="text-accent">by sharing.</span></>}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-8">
              {isFr ? 'Zéro contenu à créer. Choisis un produit, partage ton lien WhatsApp, touche ta commission.' : 'Zero content to create. Pick a product, share your WhatsApp link, collect your commission.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-sm" onClick={handleStart}>
                💰 {isFr ? 'Commencer à gagner' : 'Start earning'} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-sm" onClick={() => navigate('/discover')}>
                {isFr ? 'Explorer la marketplace' : 'Explore marketplace'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">{isFr ? 'First win en 60 secondes · Inscription gratuite' : 'First win in 60 seconds · Free sign-up'}</p>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-6 px-4">
        <div className="container max-w-3xl flex flex-wrap justify-center gap-6">
          {benefits.map(b => (
            <div key={b.label} className="flex items-center gap-2 text-sm font-medium">
              <b.icon className="h-4 w-4 text-accent shrink-0" /> {b.label}
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-10">{isFr ? 'Comment tu gagnes en 3 étapes' : 'How you earn in 3 steps'}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 rounded-2xl border border-border bg-card">
                <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-accent" />
                </div>
                <p className="text-xs font-bold text-accent mb-1">{isFr ? `Étape ${i + 1}` : `Step ${i + 1}`}</p>
                <h3 className="font-bold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/20">
        <div className="container max-w-3xl">
          <h2 className="text-xl font-extrabold text-center mb-8">{isFr ? 'Ils gagnent déjà avec Siteviral' : 'They\'re already earning with Siteviral'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-card">
                <p className="text-sm text-foreground mb-3">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.flag}</span>
                  <div><p className="text-xs font-bold">{t.name}</p><p className="text-[10px] text-muted-foreground">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 text-center">
        <div className="container max-w-md">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-3">{isFr ? 'Ta 1ère vente peut tomber aujourd\'hui' : 'Your 1st sale can happen today'}</h2>
          <p className="text-sm text-muted-foreground mb-6">{isFr ? 'Inscris-toi, choisis un produit, partage. C\'est tout.' : 'Sign up, pick a product, share. That\'s it.'}</p>
          <Button size="lg" className="gap-2" onClick={handleStart}>
            💰 {isFr ? 'Je veux gagner' : 'I want to earn'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Suspense fallback={null}><LandingFooterCompact /></Suspense>
    </div>
  );
}
