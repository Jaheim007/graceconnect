import { useCallback } from 'react';
import { usePaystack } from './usePaystack';
import { callFn } from '@/lib/api';
import { convertCurrency } from '@/lib/currencyConvert';

export type PaymentMethod = 'mobile_money' | 'card';
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

    const wantsMoMo = method === 'mobile_money';

    if (wantsMoMo && !hasPaystackKey) {
      throw new Error('Mobile Money est temporairement indisponible. Choisissez Carte bancaire ou réessayez dans quelques instants.');
    }

    // Defensive: validate currency is Paystack-compatible for MoMo
    const PAYSTACK_SUPPORTED = new Set(['NGN', 'GHS', 'ZAR', 'KES', 'XOF', 'EGP', 'RWF', 'XAF']);
    if (wantsMoMo && currency && !PAYSTACK_SUPPORTED.has(currency.toUpperCase())) {
      throw new Error(`La devise ${currency} n'est pas supportée par Mobile Money. Veuillez choisir Carte bancaire.`);
    }

    if (wantsMoMo) {
      // ── PAYSTACK (Mobile Money only) ──
      // Convert to XOF if merchant only supports XOF (Paystack account currency)
      let paystackAmount = amount;
      let paystackCurrency = currency;
      const MERCHANT_CURRENCY = 'XOF';
      if (currency && currency.toUpperCase() !== MERCHANT_CURRENCY) {
        const converted = convertCurrency(amount, currency, MERCHANT_CURRENCY);
        if (converted === null) {
          throw new Error(`Impossible de convertir ${currency} en ${MERCHANT_CURRENCY}. Veuillez choisir Carte bancaire.`);
        }
        paystackAmount = converted;
        paystackCurrency = MERCHANT_CURRENCY;
      }

      await openPaystack({
        email,
        amount: paystackAmount,
        currency: paystackCurrency,
        subaccount,
        platformFeeAmount: platformFeeAmount
          ? Math.round(platformFeeAmount * (paystackAmount / amount))
          : undefined,
        metadata: {
          ...metadata,
          type,
          organization_id,
          campaign_id: campaign_id || null,
          product_id: product_id || null,
          buyer_name: buyer_name || null,
          affiliate_code: affiliate_code || null,
          payment_channel: 'mobile_money',
          original_currency: currency !== paystackCurrency ? currency : undefined,
          original_amount: currency !== paystackCurrency ? amount : undefined,
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

