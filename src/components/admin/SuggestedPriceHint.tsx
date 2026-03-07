import { useMemo } from 'react';
import { useOrgProducts } from '@/hooks/useMonetization';
import { useOrg } from '@/contexts/OrgContext';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Inline price suggestion shown on the product form.
 * Shows "Similar products sell between X and Y" based on real data + benchmarks.
 */
export function SuggestedPriceHint({ productType }: { productType: string }) {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const currency = currentOrg?.currency || 'XOF';
  const isFr = locale === 'fr';

  const suggestion = useMemo(() => {
    // Get prices from published paid products of same type
    const samePrices = products
      .filter(p => p.is_published && !p.is_free && (p.price || 0) > 0 && p.product_type === productType)
      .map(p => p.price || 0);

    // Platform benchmarks by type (XOF)
    const benchmarks: Record<string, [number, number]> = {
      pdf: [1500, 10000],
      ebook: [2000, 15000],
      video: [3000, 20000],
      audio: [2000, 10000],
      course: [5000, 30000],
      other: [1000, 15000],
    };

    const [benchMin, benchMax] = benchmarks[productType] || benchmarks.other;

    if (samePrices.length >= 2) {
      const min = Math.min(...samePrices);
      const max = Math.max(...samePrices);
      return { min, max, source: 'org' as const };
    }

    // Convert benchmark from XOF if org uses different currency
    const rate = currency === 'XOF' ? 1 : currency === 'USD' ? 0.0016 : currency === 'EUR' ? 0.0015 : 1;
    return {
      min: Math.round(benchMin * rate),
      max: Math.round(benchMax * rate),
      source: 'platform' as const,
    };
  }, [products, productType, currency]);

  if (!suggestion) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5 border border-border/50">
      <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
      <span>
        {isFr ? (
          <>
            {suggestion.source === 'org' ? 'Vos produits similaires' : 'Produits similaires'} se vendent entre{' '}
            <strong className="text-foreground">{formatCurrency(suggestion.min, currency)}</strong> et{' '}
            <strong className="text-foreground">{formatCurrency(suggestion.max, currency)}</strong>
          </>
        ) : (
          <>
            {suggestion.source === 'org' ? 'Your similar products' : 'Similar products'} sell between{' '}
            <strong className="text-foreground">{formatCurrency(suggestion.min, currency)}</strong> and{' '}
            <strong className="text-foreground">{formatCurrency(suggestion.max, currency)}</strong>
          </>
        )}
      </span>
    </div>
  );
}
