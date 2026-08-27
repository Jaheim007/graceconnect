/**
 * Reactive hook for the user's chosen display currency.
 * Listens to sv:currency-change events from GlobalPreferencesSelector.
 * Use this everywhere you need to format prices for display.
 */
import { useState, useEffect, useCallback, startTransition } from 'react';
import { detectCurrencyFromTimezone } from '@/lib/countryDetect';
import { formatCurrency, formatPrice } from '@/lib/currency';
import { convertCurrency } from '@/lib/currencyConvert';

function getDisplayCurrency(): string {
  if (typeof localStorage === 'undefined') return 'XOF';
  return localStorage.getItem('sv_display_currency') || detectCurrencyFromTimezone();
}

export function useDisplayCurrency() {
  // SSR renders the default; the real currency is resolved after hydration.
  const [currency, setCurrency] = useState('XOF');

  useEffect(() => {
    const resolved = getDisplayCurrency();
    if (resolved !== 'XOF') startTransition(() => setCurrency(resolved));
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent<{ currency: string }>) => {
      setCurrency(e.detail.currency);
    };
    window.addEventListener('sv:currency-change' as any, handler as any);
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

  const toDisplayAmount = useCallback(
    (amount: number, sourceCurrency?: string | null): number => {
      if (!sourceCurrency) return amount;
      const from = sourceCurrency.toUpperCase();
      const to = currency.toUpperCase();
      if (from === to) return amount;
      return convertCurrency(amount, from, to) ?? amount;
    },
    [currency]
  );

  const fmt = useCallback(
    (amount: number, sourceCurrency?: string | null) => {
      const converted = toDisplayAmount(amount, sourceCurrency);
      return formatCurrency(converted, currency);
    },
    [currency, toDisplayAmount]
  );

  const fmtPrice = useCallback(
    (amount: number, isFree: boolean | null | undefined, sourceCurrency?: string | null, freeLabel?: string) => {
      if (isFree || amount === 0) return freeLabel || 'Free';
      const converted = toDisplayAmount(amount, sourceCurrency);
      return formatPrice(converted, false, currency, undefined, freeLabel);
    },
    [currency, toDisplayAmount]
  );

  return { currency, fmt, fmtPrice, toDisplayAmount };
}
