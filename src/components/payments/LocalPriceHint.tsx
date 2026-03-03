import { useLocalCurrency } from '@/hooks/useLocalCurrency';
import { cn } from '@/lib/utils';

interface LocalPriceHintProps {
  amount: number;
  currency: string;
  className?: string;
}

/**
 * Shows "≈ X FCFA" when the product currency differs from the buyer's local currency.
 * Renders nothing if same currency or conversion unavailable.
 */
export function LocalPriceHint({ amount, currency, className }: LocalPriceHintProps) {
  const { formatLocal, needsConversion } = useLocalCurrency();

  if (!currency || !needsConversion(currency) || amount <= 0) return null;

  const hint = formatLocal(amount, currency);
  if (!hint) return null;

  return (
    <span className={cn('text-[10px] text-muted-foreground font-normal', className)}>
      {hint}
    </span>
  );
}
