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

/** Check if Mobile Money is available (only in Paystack African corridors) */
export function isMoMoAvailable(currency?: string): boolean {
  const moMoCurrencies = new Set(['XOF', 'GHS', 'KES', 'XAF']);
  if (currency && moMoCurrencies.has(currency.toUpperCase())) return true;

  const moMoCountries = new Set([
    'CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GN', 'GW', // XOF
    'GH', // GHS
    'KE', // KES
    'CM', 'GA', 'CG', 'CF', 'TD', 'GQ', // XAF
  ]);
  const country = detectCountryFromTimezone();
  return !!country && moMoCountries.has(country);
}

/** Get a human-readable label for the active gateway */
export function gatewayLabel(gw: PaymentGateway): string {
  return gw === 'paystack' ? 'Paystack' : 'Stripe';
}
