/**
 * Currency conversion utility.
 * Uses Open Exchange Rates (free tier) with localStorage cache (24h).
 * Fallback: hardcoded rates for offline/error scenarios.
 */

const CACHE_KEY = 'sv_fx_rates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

/** Hardcoded fallback rates (vs USD). Updated periodically. */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  XOF: 615,
  XAF: 615,
  NGN: 1550,
  GHS: 15.5,
  KES: 153,
  ZAR: 18.5,
  MAD: 10,
  TND: 3.1,
  GNF: 8600,
  CDF: 2850,
  RWF: 1350,
  BIF: 2850,
  MGA: 4600,
  MZN: 64,
  AOA: 830,
  UGX: 3800,
  TZS: 2550,
  ETB: 57,
  EGP: 49,
  DZD: 135,
  INR: 83,
  CAD: 1.36,
  AUD: 1.54,
  CHF: 0.88,
  JPY: 150,
  CNY: 7.25,
  BRL: 5,
  MXN: 17.2,
  AED: 3.67,
  SAR: 3.75,
  KMF: 460,
  DJF: 178,
  SCR: 14.5,
  MUR: 46,
  CVE: 103,
  GMD: 67,
  SLL: 22000,
  LRD: 192,
  MWK: 1720,
  ZMW: 26,
  BWP: 13.7,
  SZL: 18.5,
  LSL: 18.5,
  NAD: 18.5,
};

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

function getCachedRates(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRates = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedRates(rates: Record<string, number>) {
  try {
    const entry: CachedRates = { rates, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch { /* quota exceeded — ignore */ }
}

let fetchPromise: Promise<Record<string, number>> | null = null;

/**
 * Fetch latest exchange rates (base USD).
 * Uses exchangerate.host (no API key needed) with fallback.
 */
async function fetchRates(): Promise<Record<string, number>> {
  // Return cached if fresh
  const cached = getCachedRates();
  if (cached) return cached.rates;

  // Deduplicate concurrent calls
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(
        'https://api.exchangerate.host/latest?base=USD',
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data?.rates && typeof data.rates === 'object') {
        const rates = { USD: 1, ...data.rates };
        setCachedRates(rates);
        return rates;
      }
      throw new Error('Invalid response');
    } catch {
      // Try alternative API
      try {
        const res2 = await fetch(
          'https://open.er-api.com/v6/latest/USD',
          { signal: AbortSignal.timeout(5000) }
        );
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2?.rates) {
            setCachedRates(data2.rates);
            return data2.rates;
          }
        }
      } catch { /* fallback below */ }

      return FALLBACK_RATES;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Get rates synchronously from cache, or fallback.
 * For instant rendering (no loading state).
 */
export function getRatesSync(): Record<string, number> {
  const cached = getCachedRates();
  return cached?.rates || FALLBACK_RATES;
}

/**
 * Convert an amount from one currency to another.
 * Uses cached rates (sync) — no loading state needed.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number | null {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;

  const rates = getRatesSync();
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) return null;

  // Convert: amount in FROM → USD → TO
  const amountInUsd = amount / fromRate;
  return Math.round(amountInUsd * toRate);
}

/**
 * Pre-warm the rates cache. Call once at app startup.
 * Non-blocking — fires and forgets.
 */
export function prefetchRates(): void {
  fetchRates().catch(() => {});
}

/**
 * Format a converted amount with "≈" prefix.
 * Returns null if no conversion needed or impossible.
 */
export function formatConvertedPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  locale = 'fr-FR'
): string | null {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return null;

  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  if (converted === null) return null;

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: toCurrency,
      maximumFractionDigits: 0,
    }).format(converted);
    return `≈ ${formatted}`;
  } catch {
    return `≈ ${converted.toLocaleString(locale)} ${toCurrency}`;
  }
}
