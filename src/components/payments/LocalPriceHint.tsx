import { useLocalCurrency } from '@/hooks/useLocalCurrency';
import { cn } from '@/lib/utils';

interface LocalPriceHintProps {
  amount: number;
  currency: string;
  className?: string;
  /** Show "estimated" disclaimer (default true for catalog usage) */
  showDisclaimer?: boolean;
}

/**
 * Shows "≈ X FCFA" when the product currency differs from the buyer's local currency.
 * Only for catalog/discover pages — NEVER in checkout/payment modals.
 * Renders nothing if same currency or conversion unavailable.
 */
export function LocalPriceHint({ amount, currency, className, showDisclaimer = true }: LocalPriceHintProps) {
  const { formatLocal, needsConversion } = useLocalCurrency();

  if (!currency || !needsConversion(currency) || amount <= 0) return null;

  const hint = formatLocal(amount, currency);
  if (!hint) return null;

  return (
    <span className={cn('text-[10px] text-muted-foreground font-normal', className)}>
      {hint}
      {showDisclaimer && (
        <span className="opacity-70" title="Prix indicatif basé sur le taux du jour"> *</span>
      )}
    </span>
  );
}
