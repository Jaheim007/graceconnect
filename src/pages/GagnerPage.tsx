import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { GagnerTabs } from '@/components/gagner/GagnerTabs';
import { QuickShareWidget } from '@/components/gagner/QuickShareWidget';
import { ActivateAmbassadorCard } from '@/components/gagner/ActivateAmbassadorCard';

import { SocialProofBanner } from '@/components/gagner/SocialProofBanner';
import { TrustBadgesBar } from '@/components/trust/TrustBadgesBar';
import { LiveEarningsTicker } from '@/components/growth/LiveEarningsTicker';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, Zap, Search, Link2, Wallet, Calculator, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';

/** Default price anchors per currency */
const CURRENCY_DEFAULTS: Record<string, { price: number; min: number; max: number; step: number }> = {
  XOF: { price: 5000, min: 500, max: 50000, step: 500 },
  XAF: { price: 5000, min: 500, max: 50000, step: 500 },
  NGN: { price: 5000, min: 500, max: 50000, step: 500 },
  USD: { price: 10, min: 1, max: 100, step: 1 },
  EUR: { price: 10, min: 1, max: 100, step: 1 },
  GBP: { price: 8, min: 1, max: 80, step: 1 },
  GHS: { price: 50, min: 5, max: 500, step: 5 },
  KES: { price: 1000, min: 100, max: 10000, step: 100 },
  ZAR: { price: 100, min: 10, max: 1000, step: 10 },
  MAD: { price: 50, min: 10, max: 500, step: 10 },
  TND: { price: 15, min: 3, max: 150, step: 3 },
};

function EarningsCalculator() {
  const { currency, fmt } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const range = CURRENCY_DEFAULTS[currency] || CURRENCY_DEFAULTS.USD;

  const [price, setPrice] = useState(range.price);
  const [commission, setCommission] = useState(20);
  const [friends, setFriends] = useState(10);

  const effectivePrice = Math.max(range.min, Math.min(price, range.max));
  const perSale = Math.round(effectivePrice * commission / 100);
  const total = perSale * friends;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden rounded-3xl border border-emerald-500/25 glass-premium backdrop-blur-xl p-5 sm:p-7 shadow-[0_18px_50px_-24px_hsl(var(--foreground)/0.35)]"
    >
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
      <h2 className="relative font-extrabold text-sm mb-5 flex items-center gap-2 tracking-tight">
        <span className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <Calculator className="h-4 w-4 text-emerald-500" />
        </span>
        {isFr ? 'Calcule tes gains' : 'Calculate your earnings'}
      </h2>

      <div className="relative space-y-5">

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">{isFr ? 'Prix du produit' : 'Product price'}</span>
            <span className="font-bold">{fmt(effectivePrice)}</span>
          </div>
          <Slider
            value={[effectivePrice]}
            onValueChange={([v]) => setPrice(v)}
            min={range.min}
            max={range.max}
            step={range.step}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">{isFr ? 'Taux de commission' : 'Commission rate'}</span>
            <span className="font-bold">{commission}%</span>
          </div>
          <Slider
            value={[commission]}
            onValueChange={([v]) => setCommission(v)}
            min={5}
            max={50}
            step={5}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">{isFr ? "Nombre d'amis qui achètent" : 'Friends who buy'}</span>
            <span className="font-bold">{friends}</span>
          </div>
          <Slider
            value={[friends]}
            onValueChange={([v]) => setFriends(v)}
            min={1}
            max={100}
            step={1}
          />
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/25 p-5 text-center">
          <div className="pointer-events-none absolute inset-x-0 -bottom-16 h-32 bg-emerald-500/10 blur-2xl" aria-hidden />
          <p className="relative text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-1">{isFr ? 'Tu gagnes par vente' : 'You earn per sale'}</p>
          <p className="relative text-xl font-black text-emerald-500 tabular-nums">{fmt(perSale)}</p>
          <div className="relative border-t border-emerald-500/20 mt-4 pt-4">
            <p className="text-xs text-muted-foreground mb-1">
              {friends} {isFr ? `ami${friends > 1 ? 's' : ''} achètent` : `friend${friends > 1 ? 's' : ''} buy`} =
            </p>
            <motion.p
              key={total}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="text-3xl sm:text-4xl font-black text-emerald-500 tabular-nums tracking-tight"
            >
              {fmt(total)}
            </motion.p>
            <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              {isFr ? 'dans ta poche' : 'in your pocket'}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default function GagnerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const STEPS = isFr ? [
    { icon: Search, emoji: '🔍', title: 'Choisis un produit', desc: 'Parcours les ebooks, formations et ressources. Filtre par taux de commission.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Link2, emoji: '🔗', title: 'Partage ton lien', desc: '1 clic = ton lien unique. Partage-le sur WhatsApp, Facebook, Telegram…', color: 'text-accent', bg: 'bg-accent/10' },
    { icon: Wallet, emoji: '💰', title: 'Touche ta commission', desc: 'Chaque vente via ton lien = commission instantanée. Retire sur Mobile Money.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ] : [
    { icon: Search, emoji: '🔍', title: 'Pick a product', desc: 'Browse ebooks, courses and resources. Filter by commission rate.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Link2, emoji: '🔗', title: 'Share your link', desc: '1 click = your unique link. Share on WhatsApp, Facebook, Telegram…', color: 'text-accent', bg: 'bg-accent/10' },
    { icon: Wallet, emoji: '💰', title: 'Earn commission', desc: 'Every sale via your link = instant commission. Withdraw on Mobile Money.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <AdaptiveLayout>
    <div className="min-h-screen">
      <SEOHead
        title={isFr ? 'Gagner en partageant — Marketplace Ambassadeur | Siteviral' : 'Earn by sharing — Ambassador Marketplace | Siteviral'}
        description={isFr ? 'Parcours les produits à promouvoir, deviens ambassadeur en 1 clic et gagne 5-50% de commission sur chaque vente.' : 'Browse products to promote, become an ambassador in 1 click and earn 5-50% commission on every sale.'}
        canonicalUrl="https://siteviral.com/gagner"
      />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 overflow-hidden" aria-hidden>
          <div className="absolute left-1/4 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/20 blur-[90px]" />
          <div className="absolute right-1/4 top-8 h-56 w-56 translate-x-1/2 rounded-full bg-emerald-500/15 blur-[90px]" />
        </div>

        <div className="container relative max-w-5xl px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-accent/25 glass-premium backdrop-blur-xl p-6 sm:p-9 shadow-[0_24px_60px_-30px_hsl(var(--foreground)/0.4)]"
        >
          <div className="pointer-events-none absolute -top-20 -left-10 h-52 w-52 rounded-full bg-accent/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-52 w-52 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/25 to-emerald-500/15 border border-accent/25 flex items-center justify-center shrink-0">
              <Share2 className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isFr ? 'Programme ambassadeur' : 'Ambassador program'}
              </span>
              <h1 className="mt-3 text-2xl sm:text-4xl font-black leading-[1.08] tracking-tight">
                {isFr ? 'Gagne en ' : 'Earn by '}
                <span className="bg-gradient-to-r from-accent via-emerald-500 to-accent bg-clip-text text-transparent">
                  {isFr ? 'partageant' : 'sharing'}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
                {isFr
                  ? 'Choisis un produit, partage ton lien, touche ta commission. Zéro contenu à créer.'
                  : 'Pick a product, share your link, earn your commission. Zero content to create.'}
              </p>
            </div>
            {!user && (
              <Button size="lg" className="gap-2 shrink-0 rounded-full" onClick={() => navigate('/auth?intent=ambassador&redirect=/gagner')}>
                <Zap className="h-4 w-4" /> {isFr ? "S'inscrire gratuitement" : 'Sign up free'} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 glass backdrop-blur-xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.35)]"
            >
              <div className={`pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full ${step.bg} blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100`} aria-hidden />
              <span className="absolute top-3 right-3 text-xs font-black text-muted-foreground/40 tabular-nums">
                0{i + 1}
              </span>
              <div className={`relative h-12 w-12 rounded-2xl ${step.bg} border border-border/50 flex items-center justify-center mx-auto mb-3`}>
                <step.icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <h3 className="relative font-bold text-sm mb-1 tracking-tight">{step.title}</h3>
              <p className="relative text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>


        <SocialProofBanner />
        <LiveEarningsTicker />
        <ActivateAmbassadorCard />

        <QuickShareWidget />
        <EarningsCalculator />
        <GagnerTabs />

        <TrustBadgesBar compact />
        </div>
      </div>
    </div>

    </AdaptiveLayout>
  );
}
