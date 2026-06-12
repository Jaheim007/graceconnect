/**
 * Payment gateway routing logic.
 *
 * Post-Paystack migration:
 *   - GeniusPay   → primary gateway for African transactions (Wave, Orange, MTN, Moov, card)
 *                   Hosted checkout supports XOF, EUR, USD natively + 9 PawaPay currencies converted to XOF.
 *   - Stripe      → fallback for non-African card transactions (EUR/USD outside Africa).
 *   - "paystack"  → DEPRECATED — kept only as a legacy label for old DB rows / audit logs.
 */

import { detectCountryFromTimezone } from '@/lib/countryDetect';

export type PaymentGateway = 'geniuspay' | 'stripe' | 'paystack';

/** Currencies natively handled by GeniusPay (directly, or via PawaPay conversion to XOF) */
const GENIUSPAY_CURRENCIES = new Set([
  // Direct GeniusPay support
  'XOF', 'EUR', 'USD',
  // Converted to XOF transparently via PawaPay
  'XAF', 'CDF', 'KES', 'RWF', 'SLE', 'UGX', 'ZMW', 'GHS', 'NGN',
]);

/** Countries where GeniusPay can collect payments (Wave/MoMo + PawaPay coverage) */
const GENIUSPAY_COUNTRIES = new Set([
  // West Africa (XOF)
  'CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN', 'GW',
  // Central Africa (XAF)
  'CM', 'GA', 'CG', 'CF', 'TD', 'GQ',
  // PawaPay extra coverage
  'CD', 'KE', 'RW', 'SL', 'UG', 'ZM',
  // Direct
  'GH', 'NG',
]);

/**
 * Determine which gateway to use based on currency and/or user country.
 * Priority: currency match → country match → Stripe fallback.
 */
export function resolveGateway(currency?: string): PaymentGateway {
  if (currency && GENIUSPAY_CURRENCIES.has(currency.toUpperCase())) {
    return 'geniuspay';
  }
  const country = detectCountryFromTimezone();
  if (country && GENIUSPAY_COUNTRIES.has(country)) {
    return 'geniuspay';
  }
  return 'stripe';
}

/**
 * Mobile Money availability. GeniusPay supports MoMo across all of West/Central Africa
 * + PawaPay extras (KE, RW, UG, ZM, SL, CD), so the matrix is much broader than Paystack.
 */
const MOMO_CURRENCIES = new Set([
  'XOF', 'XAF', 'GHS', 'KES', 'RWF', 'UGX', 'ZMW', 'CDF', 'SLE',
]);

export function isMoMoAvailable(currency?: string): boolean {
  if (currency) return MOMO_CURRENCIES.has(currency.toUpperCase());
  const country = detectCountryFromTimezone();
  return !!country && GENIUSPAY_COUNTRIES.has(country);
}

/** Backward-compat: any currency GeniusPay can collect (used to be `isPaystackCurrency`) */
export function isPaystackCurrency(currency: string): boolean {
  return GENIUSPAY_CURRENCIES.has(currency.toUpperCase());
}

/** Backward-compat alias for new code */
export const isGeniusPayCurrency = isPaystackCurrency;

export function gatewayLabel(gw: PaymentGateway): string {
  if (gw === 'geniuspay') return 'GeniusPay';
  if (gw === 'paystack') return 'Paystack (legacy)';
  return 'Stripe';
}

