/**
 * Reactive hook for the user's chosen display currency.
 * Listens to sv:currency-change events from GlobalPreferencesSelector.
 * Use this everywhere you need to format prices for display.
 */
import { useState, useEffect, useCallback } from 'react';
import { detectCurrencyFromTimezone } from '@/lib/countryDetect';
import { formatCurrency, formatPrice } from '@/lib/currency';

function getDisplayCurrency(): string {
  return localStorage.getItem('sv_display_currency') || detectCurrencyFromTimezone();
}

export function useDisplayCurrency() {
  const [currency, setCurrency] = useState(getDisplayCurrency);

  useEffect(() => {
    const handler = (e: CustomEvent<{ currency: string }>) => {
      setCurrency(e.detail.currency);
    };
    window.addEventListener('sv:currency-change' as any, handler as any);
    // Also sync on storage changes (other tabs)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sv_display_currency' && e.newValue) {
        setCurrency(e.newValue);
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sv:currency-change' as any, handler as any);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const fmt = useCallback(
    (amount: number, sourceCurrency?: string | null) => {
      const cur = sourceCurrency || currency;
      return formatCurrency(amount, cur);
    },
    [currency]
  );

  const fmtPrice = useCallback(
    (amount: number, isFree: boolean | null | undefined, sourceCurrency?: string | null, freeLabel?: string) => {
      const cur = sourceCurrency || currency;
      return formatPrice(amount, isFree, cur, undefined, freeLabel);
    },
    [currency]
  );

  return { currency, fmt, fmtPrice };
}
