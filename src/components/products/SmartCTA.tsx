import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { ShoppingBag, Users, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useExperimentContent, useExperimentClick } from '@/hooks/useExperimentContent';
import { useI18n } from '@/i18n/I18nContext';

interface SmartCTAProps {
  product: any;
  isPurchased: boolean;
  onBuy: () => void;
  onAccess?: () => void;
  className?: string;
}

const nudges = [
  { icon: Users, text: (n: number, isFr: boolean) => isFr ? `${n}+ personnes ont acheté ce produit` : `${n}+ people bought this product` },
  { icon: TrendingUp, text: (_n: number, isFr: boolean) => isFr ? 'Populaire cette semaine' : 'Popular this week' },
  { icon: Zap, text: (_n: number, isFr: boolean) => isFr ? 'Achat instantané — accès immédiat' : 'Instant purchase — immediate access' },
];

export function SmartCTA({ product, isPurchased, onBuy, onAccess, className }: SmartCTAProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [nudgeIdx, setNudgeIdx] = useState(0);
  const salesCount = product?.sales_count || 0;

  // Rotate nudges every 4s
  useEffect(() => {
    if (isPurchased || salesCount < 1) return;
    const timer = setInterval(() => {
      setNudgeIdx(i => (i + 1) % nudges.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPurchased, salesCount]);

  // Recent purchases (last 24h)
  const { data: recentBuyers = 0 } = useQuery({
    queryKey: ['recent-buyers', product?.id],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await db
        .from('product_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', product.id)
        .eq('status', 'completed')
        .gte('created_at', since);
      return count || 0;
    },
    enabled: !!product?.id && !isPurchased,
    staleTime: 60_000,
  });

  if (isPurchased) {
    return (
      <div className={cn('space-y-2', className)}>
        <Button
          size="lg"
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg"
          onClick={onAccess}
        >
          <ShoppingBag className="h-4 w-4" />
          {isFr ? 'Accéder au contenu' : 'Access content'}
        </Button>
        <p className="text-center text-xs text-emerald-600 font-medium">✓ {isFr ? 'Déjà acheté' : 'Already purchased'}</p>
      </div>
    );
  }

  const isPwyw = !!(product as any)?.is_pwyw;
  const isFree = !isPwyw && !!product?.is_free;
  const hasSale = !isPwyw && !isFree && product?.sale_price && product?.sale_price < product?.price;
  const displayPrice = hasSale ? product.sale_price : product.price;
  const currency = product?.currency || 'XOF';
  const minPrice = (product as any)?.min_price || 0;

  const currentNudge = nudges[nudgeIdx];
  const NudgeIcon = currentNudge.icon;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Social proof nudge */}
      {salesCount > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={nudgeIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10"
          >
            <NudgeIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-primary font-medium">
              {currentNudge.text(salesCount, isFr)}
            </span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Recent buyer activity */}
      {recentBuyers > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          {isFr ? `${recentBuyers} achat${recentBuyers > 1 ? 's' : ''} dans les dernières 24h` : `${recentBuyers} purchase${recentBuyers > 1 ? 's' : ''} in the last 24h`}
        </div>
      )}

      {/* Main CTA — A/B testable via experiment slot "product-cta" */}
      <ProductCTAButton
        isPwyw={isPwyw}
        isFree={isFree}
        minPrice={minPrice}
        displayPrice={displayPrice}
        currency={currency}
        onBuy={onBuy}
      />

      {/* Strikethrough original price */}
      {hasSale && (
        <p className="text-center text-xs text-muted-foreground">
          <span className="line-through">{formatPrice(product.price, false, currency)}</span>
          <span className="ml-2 text-destructive font-semibold">
            -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
          </span>
        </p>
      )}
    </div>
  );
}

/** Sub-component that uses experiment hook at top level (no conditional) */
function ProductCTAButton({
  isPwyw, isFree, minPrice, displayPrice, currency, onBuy,
}: {
  isPwyw: boolean; isFree: boolean; minPrice: number; displayPrice: number; currency: string; onBuy: () => void;
}) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const defaultLabel = isPwyw
    ? `💰 ${isFr ? 'Prix libre' : 'Name your price'}${minPrice > 0 ? ` · ${formatPrice(minPrice, false, currency)}+` : ''}`
    : isFree
      ? (isFr ? 'Obtenir gratuitement' : 'Get for free')
      : `${isFr ? 'Acheter' : 'Buy'} — ${formatPrice(displayPrice, false, currency)}`;

  const ctaExperiment = useExperimentContent('cta', defaultLabel);
  const trackClick = useExperimentClick();

  return (
    <Button
      size="lg"
      className="w-full gap-2 font-semibold shadow-lg text-base h-12"
      onClick={() => {
        trackClick(ctaExperiment);
        onBuy();
      }}
    >
      <ShoppingBag className="h-5 w-5" />
      {ctaExperiment.value}
    </Button>
  );
}