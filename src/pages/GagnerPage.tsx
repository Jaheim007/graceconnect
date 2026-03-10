import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { GagnerTabs } from '@/components/gagner/GagnerTabs';
import { QuickShareWidget } from '@/components/gagner/QuickShareWidget';
import { SocialProofBanner } from '@/components/gagner/SocialProofBanner';
// AmbassadorLeaderboard hidden temporarily (bluff strategy — re-enable when real volume exists)
import { TrustBadgesBar } from '@/components/trust/TrustBadgesBar';
import { LiveEarningsTicker } from '@/components/growth/LiveEarningsTicker';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, Zap, Search, Link2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

const STEPS = [
  {
    icon: Search,
    emoji: '🔍',
    title: 'Choisis un produit',
    desc: 'Parcours les ebooks, formations et ressources. Filtre par taux de commission.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Link2,
    emoji: '🔗',
    title: 'Partage ton lien',
    desc: '1 clic = ton lien unique. Partage-le sur WhatsApp, Facebook, Telegram…',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Wallet,
    emoji: '💰',
    title: 'Touche ta commission',
    desc: 'Chaque vente via ton lien = commission instantanée. Retire sur Mobile Money.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

function EarningsCalculator() {
  const [price, setPrice] = useState(5000);
  const [commission, setCommission] = useState(20);
  const [friends, setFriends] = useState(10);

  const perSale = Math.round(price * commission / 100);
  const total = perSale * friends;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-emerald-500/20 bg-card p-5 sm:p-6"
    >
      <h3 className="font-extrabold text-sm mb-4 flex items-center gap-2">
        🧮 Calcule tes gains
      </h3>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Prix du produit</span>
            <span className="font-bold">{formatCurrency(price, DEFAULT_CURRENCY)}</span>
          </div>
          <Slider
            value={[price]}
            onValueChange={([v]) => setPrice(v)}
            min={500}
            max={50000}
            step={500}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Taux de commission</span>
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
            <span className="text-muted-foreground">Nombre d'amis qui achètent</span>
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
          <p className="text-xs text-muted-foreground mb-1">Tu gagnes par vente</p>
          <p className="text-lg font-black text-emerald-500">{formatCurrency(perSale, DEFAULT_CURRENCY)}</p>
          <div className="border-t border-emerald-500/20 mt-3 pt-3">
            <p className="text-xs text-muted-foreground mb-1">{friends} ami{friends > 1 ? 's' : ''} achètent =</p>
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(total, DEFAULT_CURRENCY)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">dans ta poche 💰</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * /gagner — The ambassador marketplace hub.
 * Browse products, see leaderboard, share earnings.
 */
export default function GagnerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AdaptiveLayout>
    <div className="min-h-screen">
      <SEOHead
        title="Gagner en partageant — Marketplace Ambassadeur | Siteviral"
        description="Parcours les produits à promouvoir, deviens ambassadeur en 1 clic et gagne 5-50% de commission sur chaque vente."
        canonicalUrl="https://siteviral.com/gagner"
      />

      <div className="container max-w-5xl px-4 py-8 space-y-8">
        {/* Hero banner */}
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
                Gagne en partageant 💰
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choisis un produit, partage ton lien, touche ta commission. Zéro contenu à créer.
              </p>
            </div>
            {!user && (
              <Button className="gap-2 shrink-0" onClick={() => navigate('/auth?intent=ambassador&redirect=/gagner')}>
                <Zap className="h-4 w-4" /> S'inscrire gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* 3-step how it works */}
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

        {/* Social proof stats */}
        <SocialProofBanner />

        {/* Live earnings ticker */}
        <LiveEarningsTicker />

        {/* Quick share widget for logged-in users */}
        <QuickShareWidget />

        {/* Earnings calculator */}
        <EarningsCalculator />

        {/* Ambassador leaderboard */}
        <AmbassadorLeaderboard />

        {/* Main tabs */}
        <GagnerTabs />

        {/* Trust badges */}
        <TrustBadgesBar compact />
      </div>
    </div>
    </AdaptiveLayout>
  );
}
