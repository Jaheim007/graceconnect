import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { GagnerTabs } from '@/components/gagner/GagnerTabs';
import { QuickShareWidget } from '@/components/gagner/QuickShareWidget';
import { SocialProofBanner } from '@/components/gagner/SocialProofBanner';
import { TrustBadgesBar } from '@/components/trust/TrustBadgesBar';
import { LiveEarningsTicker } from '@/components/growth/LiveEarningsTicker';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, Zap, Search, Link2, Wallet } from 'lucide-react';
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
      className="rounded-2xl border border-emerald-500/20 bg-card p-5 sm:p-6"
    >
      <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2">
        🧮 {isFr ? 'Calcule tes gains' : 'Calculate your earnings'}
      </h3>

      <div className="space-y-5">
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

        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{isFr ? 'Tu gagnes par vente' : 'You earn per sale'}</p>
          <p className="text-lg font-black text-emerald-500">{fmt(perSale)}</p>
          <div className="border-t border-emerald-500/20 mt-3 pt-3">
            <p className="text-xs text-muted-foreground mb-1">
              {friends} {isFr ? `ami${friends > 1 ? 's' : ''} achètent` : `friend${friends > 1 ? 's' : ''} buy`} =
            </p>
            <p className="text-2xl font-black text-emerald-600">{fmt(total)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{isFr ? 'dans ta poche 💰' : 'in your pocket 💰'}</p>
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

      <div className="container max-w-5xl px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card to-primary/5 p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
              <Share2 className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">
                {isFr ? 'Gagne en partageant 💰' : 'Earn by sharing 💰'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isFr
                  ? 'Choisis un produit, partage ton lien, touche ta commission. Zéro contenu à créer.'
                  : 'Pick a product, share your link, earn your commission. Zero content to create.'}
              </p>
            </div>
            {!user && (
              <Button className="gap-2 shrink-0" onClick={() => navigate('/auth?intent=ambassador&redirect=/gagner')}>
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
              className="relative rounded-2xl border border-border bg-card p-5 text-center"
            >
              <span className="absolute -top-3 left-4 bg-background border border-border rounded-full h-6 w-6 flex items-center justify-center text-xs font-black text-primary">
                {i + 1}
              </span>
              <div className={`h-11 w-11 rounded-xl ${step.bg} flex items-center justify-center mx-auto mb-3`}>
                <step.icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <h3 className="font-bold text-sm mb-1">{step.emoji} {step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <SocialProofBanner />
        <LiveEarningsTicker />
        <QuickShareWidget />
        <EarningsCalculator />
        <GagnerTabs />
        <TrustBadgesBar compact />
      </div>
    </div>
    </AdaptiveLayout>
  );
}
