import { useCallback } from 'react';
import { usePaystack } from './usePaystack';
import { callFn } from '@/lib/api';

export type PaymentMethod = 'mobile_money' | 'card' | 'apple_pay';
export type PaymentGateway = 'paystack' | 'stripe';

interface PaymentParams {
  method: PaymentMethod;
  email: string;
  amount: number;
  currency: string;
  type: 'donation' | 'product';
  organization_id: string;
  campaign_id?: string;
  product_id?: string;
  buyer_name?: string;
  affiliate_code?: string | null;
  promo_code?: string;
  // Paystack split payment params
  subaccount?: string;
  platformFeeAmount?: number;
  metadata?: Record<string, unknown>;
  // Callbacks
  onSuccess: (reference: string, gateway: PaymentGateway) => void;
  onClose: () => void;
}

/**
 * Unified payment gateway hook.
 * Routing policy:
 * - Mobile Money => Paystack
 * - Card => Stripe
 */
export function usePaymentGateway() {
  const { openPayment: openPaystack, hasKey: hasPaystackKey } = usePaystack();

  const openPayment = useCallback(async (params: PaymentParams) => {
    const {
      method, email, amount, currency, type,
      organization_id, campaign_id, product_id,
      buyer_name, affiliate_code, promo_code,
      subaccount, platformFeeAmount, metadata,
      onSuccess, onClose,
    } = params;

    const usePaystack = method === 'mobile_money' || method === 'apple_pay';

    if (usePaystack && !hasPaystackKey) {
      throw new Error(method === 'apple_pay'
        ? 'Apple Pay est temporairement indisponible. Choisissez Carte bancaire ou réessayez dans quelques instants.'
        : 'Mobile Money est temporairement indisponible. Choisissez Carte bancaire ou réessayez dans quelques instants.');
    }

    // Defensive: validate currency is Paystack-compatible
    const PAYSTACK_SUPPORTED = new Set(['NGN', 'GHS', 'ZAR', 'KES', 'XOF', 'EGP', 'RWF', 'XAF']);
    if (usePaystack && currency && !PAYSTACK_SUPPORTED.has(currency.toUpperCase())) {
      throw new Error(`La devise ${currency} n'est pas supportée par ${method === 'apple_pay' ? 'Apple Pay' : 'Mobile Money'}. Veuillez choisir Carte bancaire.`);
    }

    if (usePaystack) {
      // ── PAYSTACK (Mobile Money only) ──
      // NOTE: subaccount is intentionally omitted for MoMo payments.
      // Paystack subaccounts are currency-specific (e.g. NGN-only) and will
      // reject transactions in other currencies ("Currency not supported by merchant").
      // The platform collects centrally and handles payouts separately.
      await openPaystack({
        email,
        amount,
        currency,
        channels: method === 'apple_pay' ? ['apple_pay'] : undefined,
        metadata: {
          ...metadata,
          type,
          organization_id,
          campaign_id: campaign_id || null,
          product_id: product_id || null,
          buyer_name: buyer_name || null,
          affiliate_code: affiliate_code || null,
          payment_channel: method === 'apple_pay' ? 'apple_pay' : 'mobile_money',
        },
        onSuccess: (reference) => onSuccess(reference, 'paystack'),
        onClose,
      });
      return;
    }

    // ── STRIPE (all card payments) ──
    const currentUrl = window.location.origin;
    const successUrl = `${currentUrl}/payment-success`;
    const cancelUrl = window.location.href;

    const result = await callFn('stripe-create-checkout', {
      type,
      organization_id,
      campaign_id,
      product_id,
      amount,
      currency,
      buyer_name,
      buyer_email: email,
      affiliate_code,
      promo_code,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }, true);

    if (result?.checkout_url) {
      window.location.href = result.checkout_url;
    } else {
      throw new Error(result?.error || 'Failed to create Stripe checkout session');
    }
  }, [openPaystack, hasPaystackKey]);

  return {
    openPayment,
    hasPaystackKey,
  };
}

