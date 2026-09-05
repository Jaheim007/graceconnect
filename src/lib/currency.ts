/**
 * Centralized currency formatting utility.
 * 
 * Currency resolution priority:
 * 1. Explicit currency from transaction/product data
 * 2. Organization's configured currency
 * 3. Fallback to 'XOF' for legacy data
 * 
 * Each org sets its currency at creation time. Transactions store
 * the currency used at transaction time. Display always uses the
 * stored currency — never a hardcoded default.
 */

/** Supported currencies with display info */
export const SUPPORTED_CURRENCIES = [
  { code: 'XOF', label: 'CFA (FCFA)', symbol: 'FCFA', locale: 'fr-FR' },
  { code: 'XAF', label: 'CFA (FCFA)', symbol: 'FCFA', locale: 'fr-FR' },
  { code: 'USD', label: 'US Dollar ($)', symbol: '$', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€', locale: 'fr-FR' },
  { code: 'NGN', label: 'Naira (₦)', symbol: '₦', locale: 'en-NG' },
  { code: 'GHS', label: 'Cedi (₵)', symbol: '₵', locale: 'en-GH' },
  { code: 'KES', label: 'Shilling (KSh)', symbol: 'KSh', locale: 'en-KE' },
  { code: 'ZAR', label: 'Rand (R)', symbol: 'R', locale: 'en-ZA' },
  { code: 'GBP', label: 'Pound (£)', symbol: '£', locale: 'en-GB' },
  { code: 'MAD', label: 'Dirham (MAD)', symbol: 'MAD', locale: 'fr-MA' },
  { code: 'TND', label: 'Dinar (TND)', symbol: 'TND', locale: 'fr-TN' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

/** Default fallback for legacy data that has no currency set */
export const DEFAULT_CURRENCY: CurrencyCode = 'XOF';

/**
 * Format a monetary amount with the correct currency symbol.
 * Automatically picks the right locale for the currency.
 * 
 * @param amount - The amount to format
 * @param currency - ISO 4217 currency code (defaults to XOF)
 * @param userLocale - Optional override ('fr' or 'en') for number formatting
 */
export function formatCurrency(
  amount: number,
  currency?: string | null,
  userLocale?: string
): string {
  const cur = currency || DEFAULT_CURRENCY;
  
  // Determine locale: user preference > currency default > fr-FR
  let locale: string;
  if (userLocale) {
    locale = userLocale === 'fr' ? 'fr-FR' : 'en-US';
  } else {
    const info = SUPPORTED_CURRENCIES.find(c => c.code === cur);
    locale = info?.locale || 'fr-FR';
  }

  // XOF / XAF have no sub-unit: cents never exist, so 0 decimals is correct.
  // Every other currency DOES have cents — rounding them away made small
  // amounts (a 10% fee on $4) display as "0", which looked like a free sale.
  const zeroDecimal = cur === 'XOF' || cur === 'XAF';
  const digits = zeroDecimal
    ? 0
    : Number.isInteger(Number(amount.toFixed(2))) ? 0 : 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    // Fallback for unknown currency codes
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${cur}`;
  }
}

/**
 * Format price with "Free" label when applicable.
 */
export function formatPrice(
  amount: number,
  isFree: boolean | null | undefined,
  currency?: string | null,
  userLocale?: string,
  freeLabel = 'Gratuit'
): string {
  if (isFree || amount === 0) return freeLabel;
  return formatCurrency(amount, currency, userLocale);
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string) {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
}

/**
 * Returns the correct display label for a product price, handling PWYW correctly.
 * PWYW products MUST never show "Gratuit/Free" — they show "Prix libre · Dès X".
 */
export function getProductPriceLabel(product: {
  is_free?: boolean | null;
  is_pwyw?: boolean;
  min_price?: number | null;
  price?: number | null;
  sale_price?: number | null;
  sale_ends_at?: string | null;
  currency?: string | null;
}, locale: string = 'fr'): { text: string; isFree: boolean; isPwyw: boolean } {
  const isFr = locale === 'fr';
  const isPwyw = !!product.is_pwyw;
  const minPrice = product.min_price || 0;
  const currency = product.currency || 'XOF';

  if (isPwyw) {
    const tag = isFr ? 'Prix libre' : 'Name your price';
    if (minPrice > 0) {
      return {
        text: `${tag} · ${isFr ? 'Dès' : 'From'} ${formatCurrency(minPrice, currency)}`,
        isFree: false,
        isPwyw: true,
      };
    }
    return { text: tag, isFree: false, isPwyw: true };
  }

  const isFree = !!product.is_free || (product.price || 0) === 0;
  if (isFree) {
    return { text: isFr ? 'Gratuit' : 'Free', isFree: true, isPwyw: false };
  }

  // Check for active sale
  const hasSale = product.sale_price != null && product.sale_price > 0 &&
    (!product.sale_ends_at || new Date(product.sale_ends_at) > new Date());
  const displayPrice = hasSale ? product.sale_price! : (product.price || 0);

  return { text: formatCurrency(displayPrice, currency), isFree: false, isPwyw: false };
}
