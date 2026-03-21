import { DollarSign, Euro, PoundSterling, JapaneseYen, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Renders the correct currency icon based on the currency code.
 * Falls back to a text-based icon for currencies without a Lucide icon (e.g. FCFA).
 */
export function CurrencyIcon({ currency, className }: { currency?: string | null; className?: string }) {
  const code = (currency || 'XOF').toUpperCase();

  // Lucide has icons for these
  if (code === 'USD') return <DollarSign className={className} />;
  if (code === 'EUR') return <Euro className={className} />;
  if (code === 'GBP') return <PoundSterling className={className} />;
  if (['JPY', 'CNY', 'KRW'].includes(code)) return <JapaneseYen className={className} />;

  // For XOF, XAF, and other currencies, render a text symbol
  const symbolMap: Record<string, string> = {
    XOF: 'F',
    XAF: 'F',
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
    MAD: 'DH',
    TND: 'DT',
    EGP: 'E£',
    INR: '₹',
    BRL: 'R$',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'Fr',
  };

  const symbol = symbolMap[code] || code.slice(0, 2);

  return (
    <span className={cn('inline-flex items-center justify-center font-bold leading-none', className)} style={{ fontSize: 'inherit' }}>
      {symbol}
    </span>
  );
}

/**
 * Returns the matching Lucide icon for standard currencies,
 * or null for currencies that need the CurrencyIcon component.
 */
export function getCurrencyLucideIcon(currency?: string | null): LucideIcon | null {
  const code = (currency || '').toUpperCase();
  if (code === 'USD') return DollarSign;
  if (code === 'EUR') return Euro;
  if (code === 'GBP') return PoundSterling;
  if (['JPY', 'CNY', 'KRW'].includes(code)) return JapaneseYen;
  return null;
}
