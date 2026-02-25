import { useCallback } from 'react';
import { usePaystack } from './usePaystack';
import { callFn } from '@/lib/api';

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
 * - Mobile Money → Paystack (inline popup)
 * - Card → Stripe (redirect to Checkout)
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

    if (method === 'mobile_money') {
      // ── PAYSTACK (Mobile Money + local cards) ──
      await openPaystack({
        email,
        amount,
        currency,
        subaccount,
        platformFeeAmount,
        metadata: {
          ...metadata,
          type,
          organization_id,
          campaign_id: campaign_id || null,
          product_id: product_id || null,
          buyer_name: buyer_name || null,
          affiliate_code: affiliate_code || null,
        },
        onSuccess: (reference) => onSuccess(reference, 'paystack'),
        onClose,
      });
    } else {
      // ── STRIPE (International cards) ──
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
        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url;
      } else {
        throw new Error(result?.error || 'Failed to create Stripe checkout session');
      }
    }
  }, [openPaystack]);

  return {
    openPayment,
    hasPaystackKey,
  };
}
