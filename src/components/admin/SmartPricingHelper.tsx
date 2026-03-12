import { useOrg } from '@/contexts/OrgContext';
import { useOrgProducts } from '@/hooks/useMonetization';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, Lightbulb, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';

interface PricingInsight {
  type: 'tip' | 'warning' | 'opportunity';
  message: string;
  icon: typeof TrendingUp;
}

// Average prices by category (benchmark data)
const CATEGORY_BENCHMARKS: Record<string, { avgPrice: number; topPrice: number; freeRate: number }> = {
  church: { avgPrice: 3500, topPrice: 15000, freeRate: 30 },
  ngo: { avgPrice: 5000, topPrice: 20000, freeRate: 40 },
  education: { avgPrice: 8000, topPrice: 30000, freeRate: 20 },
  business: { avgPrice: 10000, topPrice: 50000, freeRate: 15 },
  media: { avgPrice: 4000, topPrice: 15000, freeRate: 25 },
  association: { avgPrice: 3000, topPrice: 10000, freeRate: 35 },
};

export function SmartPricingHelper() {
  const { currentOrg } = useOrg();
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const category = currentOrg?.category || 'other';
  const benchmark = CATEGORY_BENCHMARKS[category] || { avgPrice: 5000, topPrice: 25000, freeRate: 25 };
  const currency = currentOrg?.currency || 'XOF';

  const publishedProducts = products.filter(p => p.is_published);
  const paidProducts = publishedProducts.filter(p => !p.is_free && (p.price || 0) > 0);
  const freeProducts = publishedProducts.filter(p => p.is_free || (p.price || 0) === 0);

  if (publishedProducts.length === 0) return null;

  const avgPrice = paidProducts.length > 0
    ? Math.round(paidProducts.reduce((s, p) => s + (p.price || 0), 0) / paidProducts.length)
    : 0;

  const freeRate = publishedProducts.length > 0
    ? Math.round((freeProducts.length / publishedProducts.length) * 100)
    : 0;

  const insights: PricingInsight[] = [];

  // Pricing too low
  if (avgPrice > 0 && avgPrice < benchmark.avgPrice * 0.5) {
    insights.push({
      type: 'opportunity',
      message: isFr
        ? `Votre prix moyen (${formatCurrency(avgPrice, currency)}) est inférieur à la moyenne de votre catégorie (${formatCurrency(benchmark.avgPrice, currency)}). Testez un prix plus élevé !`
        : `Your average price (${formatCurrency(avgPrice, currency)}) is below your category average (${formatCurrency(benchmark.avgPrice, currency)}). Try a higher price!`,
      icon: ArrowUp,
    });
  }

  // Pricing too high
  if (avgPrice > benchmark.topPrice) {
    insights.push({
      type: 'warning',
      message: isFr
        ? `Votre prix moyen (${formatCurrency(avgPrice, currency)}) dépasse le top marché (${formatCurrency(benchmark.topPrice, currency)}). Vérifiez que la valeur perçue justifie ce prix.`
        : `Your average price (${formatCurrency(avgPrice, currency)}) exceeds the market top (${formatCurrency(benchmark.topPrice, currency)}). Verify the perceived value justifies this price.`,
      icon: ArrowDown,
    });
  }

  // Too many free products
  if (freeRate > 60) {
    insights.push({
      type: 'tip',
      message: isFr
        ? `${freeRate}% de vos produits sont gratuits. Convertissez vos meilleurs gratuits en produits payants (même à petit prix) pour générer des revenus.`
        : `${freeRate}% of your products are free. Convert your best free items to paid products (even at a low price) to generate revenue.`,
      icon: DollarSign,
    });
  }

  // No free product (lead magnet)
  if (freeProducts.length === 0 && paidProducts.length > 0) {
    insights.push({
      type: 'tip',
      message: isFr
        ? 'Aucun produit gratuit ! Ajoutez un « lead magnet » gratuit pour attirer de nouveaux contacts et les convertir en acheteurs.'
        : 'No free product! Add a free "lead magnet" to attract new contacts and convert them into buyers.',
      icon: Lightbulb,
    });
  }

  // Only one price point
  if (paidProducts.length >= 2) {
    const prices = paidProducts.map(p => p.price || 0);
    const uniquePrices = new Set(prices);
    if (uniquePrices.size === 1) {
      insights.push({
        type: 'tip',
        message: isFr
          ? "Tous vos produits ont le même prix. Diversifiez avec un produit d'entrée (petit prix) et un premium (prix élevé)."
          : 'All your products have the same price. Diversify with an entry product (low price) and a premium one (high price).',
        icon: TrendingUp,
      });
    }
  }

  // Good pricing
  if (insights.length === 0) {
    insights.push({
      type: 'tip',
      message: isFr
        ? `Votre pricing est aligné avec votre catégorie. Prix moyen : ${formatCurrency(avgPrice, currency)} (benchmark : ${formatCurrency(benchmark.avgPrice, currency)}).`
        : `Your pricing is aligned with your category. Average price: ${formatCurrency(avgPrice, currency)} (benchmark: ${formatCurrency(benchmark.avgPrice, currency)}).`,
      icon: TrendingUp,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{isFr ? 'Analyse de prix' : 'Price analysis'}</h3>
          <p className="text-[10px] text-muted-foreground">{paidProducts.length} {isFr ? 'produit(s) payant(s)' : 'paid product(s)'} · {freeProducts.length} {isFr ? 'gratuit(s)' : 'free'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 p-3 rounded-xl border text-xs',
                insight.type === 'warning' && 'border-amber-500/20 bg-amber-500/5',
                insight.type === 'opportunity' && 'border-emerald-500/20 bg-emerald-500/5',
                insight.type === 'tip' && 'border-border bg-muted/30'
              )}
            >
              <Icon className={cn(
                'h-3.5 w-3.5 shrink-0 mt-0.5',
                insight.type === 'warning' && 'text-amber-500',
                insight.type === 'opportunity' && 'text-emerald-500',
                insight.type === 'tip' && 'text-primary'
              )} />
              <p className="text-muted-foreground leading-relaxed">{insight.message}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
