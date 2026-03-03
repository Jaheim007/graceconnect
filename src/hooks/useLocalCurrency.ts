/**
 * Hook to detect user's local currency and provide conversion helpers.
 * Uses timezone-based detection + cached exchange rates.
 */
import { useEffect, useState } from 'react';
import { detectCurrencyFromTimezone } from '@/lib/countryDetect';
import { convertCurrency, formatConvertedPrice, prefetchRates, getRatesSync } from '@/lib/currencyConvert';

interface LocalCurrencyInfo {
  /** User's detected local currency code (e.g. 'XOF') */
  localCurrency: string;
  /** Whether local currency differs from the given product currency */
  needsConversion: (productCurrency: string) => boolean;
  /** Get "≈ X FCFA" string, or null if same currency */
  formatLocal: (amount: number, productCurrency: string) => string | null;
  /** Get raw converted amount, or null */
  convertToLocal: (amount: number, productCurrency: string) => number | null;
  /** Whether rates are loaded */
  ready: boolean;
}

export function useLocalCurrency(): LocalCurrencyInfo {
  const localCurrency = detectCurrencyFromTimezone();
  const [ready, setReady] = useState(() => !!getRatesSync());

  useEffect(() => {
    prefetchRates();
    // Rates are loaded async but getRatesSync always has fallback
    setReady(true);
  }, []);

  return {
    localCurrency,
    ready,
    needsConversion: (productCurrency: string) =>
      productCurrency.toUpperCase() !== localCurrency.toUpperCase(),
    formatLocal: (amount: number, productCurrency: string) =>
      formatConvertedPrice(amount, productCurrency, localCurrency),
    convertToLocal: (amount: number, productCurrency: string) =>
      convertCurrency(amount, productCurrency, localCurrency),
  };
}
