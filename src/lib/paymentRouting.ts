/**
 * Payment gateway routing logic.
 * Paystack is the PRIMARY gateway for all supported countries/currencies.
 * Stripe is the FALLBACK for regions where Paystack cannot operate.
 */

import { detectCountryFromTimezone } from '@/lib/countryDetect';

export type PaymentGateway = 'paystack' | 'stripe';

/** Currencies natively supported by Paystack */
const PAYSTACK_CURRENCIES = new Set([
  'NGN', 'GHS', 'ZAR', 'KES', 'XOF', 'EGP', 'RWF',
  'XAF', // Central African CFA (processed via XOF corridor)
]);

/** Countries where Paystack can collect payments */
const PAYSTACK_COUNTRIES = new Set([
  // Direct Paystack countries
  'NG', 'GH', 'ZA', 'KE', 'CI', 'EG', 'RW',
  // West Africa (XOF zone — processed through CI corridor)
  'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN', 'GW',
  // Central Africa (XAF zone)
  'CM', 'GA', 'CG', 'CF', 'TD', 'GQ',
]);

/**
 * Determine which gateway to use based on currency and/or user country.
 * Priority: currency match → country match → Stripe fallback.
 */
export function resolveGateway(currency?: string): PaymentGateway {
  // 1. If the transaction currency is Paystack-supported, use Paystack
  if (currency && PAYSTACK_CURRENCIES.has(currency.toUpperCase())) {
    return 'paystack';
  }

  // 2. If user's detected country is Paystack-supported, use Paystack
  const country = detectCountryFromTimezone();
  if (country && PAYSTACK_COUNTRIES.has(country)) {
    return 'paystack';
  }

  // 3. Fallback to Stripe for all other regions
  return 'stripe';
}

/** Currencies that support Mobile Money via Paystack (verified against Paystack API 2026-03-12) */
const MOMO_CURRENCIES = new Set(['XOF', 'GHS', 'KES']);

/**
 * Check if Mobile Money is available for a given transaction currency.
 * 
 * CRITICAL: When a product/campaign has an explicit currency, MoMo is ONLY
 * available if that currency is a MoMo-supported one. We must NOT fall back
 * to country detection because Paystack will reject currencies it doesn't
 * support (e.g. EUR, USD) even if the user is in a MoMo country.
 */
export function isMoMoAvailable(currency?: string): boolean {
  // If an explicit currency is provided, it MUST be a MoMo currency
  if (currency) {
    return MOMO_CURRENCIES.has(currency.toUpperCase());
  }

  // No currency specified — infer from user's country (legacy fallback)
  // Only countries with VERIFIED MoMo support on Paystack (2026-03-12)
  const moMoCountries = new Set([
    'CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN', 'GW', // XOF
    'GH', // GHS
    'KE', // KES
    // XAF countries (CM, GA, CG, CF, TD, GQ) REMOVED — Paystack returns no MoMo providers
  ]);
  const country = detectCountryFromTimezone();
  return !!country && moMoCountries.has(country);
}

/** Check if a currency is supported by Paystack for any payment method */
export function isPaystackCurrency(currency: string): boolean {
  return PAYSTACK_CURRENCIES.has(currency.toUpperCase());
}

/** Get a human-readable label for the active gateway */
export function gatewayLabel(gw: PaymentGateway): string {
  if (gw === 'paystack') return 'Paystack';
  return 'Stripe';
}
