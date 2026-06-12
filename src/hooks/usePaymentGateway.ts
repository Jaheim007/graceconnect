import { useCallback } from 'react';
import { useGeniusPay } from './useGeniusPay';
import { callFn } from '@/lib/api';
import { resolveGateway, type PaymentGateway } from '@/lib/paymentRouting';

export type PaymentMethod = 'mobile_money' | 'card' | 'apple_pay';
export type { PaymentGateway };

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
  customer_phone?: string;
  affiliate_code?: string | null;
  promo_code?: string;
  // Legacy Paystack split-payment params (ignored under GeniusPay; manual payouts handle org split)
  subaccount?: string;
  platformFeeAmount?: number;
  metadata?: Record<string, unknown>;
  // Callbacks
  onSuccess: (reference: string, gateway: PaymentGateway) => void;
  onClose: () => void;
}

/**
 * Unified payment gateway hook.
 *
 * Routing policy (post-Paystack migration):
 *   - Mobile Money / Apple Pay  →  GeniusPay hosted checkout (Wave, Orange, MTN, Moov, card)
 *   - Card (non-African region) →  Stripe Checkout
 *
 * GeniusPay flow is REDIRECT-based, not popup: openPayment() returns after redirect kicks off,
 * onSuccess is only called from the /payment/success page once the webhook confirms.
 */
export function usePaymentGateway() {
  const { openCheckout: openGeniusPay } = useGeniusPay();

  const openPayment = useCallback(async (params: PaymentParams) => {
    const {
      method, email, amount, currency, type,
      organization_id, campaign_id, product_id,
      buyer_name, customer_phone, affiliate_code, promo_code,
      metadata, onClose,
    } = params;

    // Resolve gateway: African currencies → GeniusPay, else Stripe.
    const gateway = method === 'card'
      ? resolveGateway(currency) === 'stripe' ? 'stripe' : 'geniuspay'
      : 'geniuspay';

    if (gateway === 'geniuspay') {
      // ── GENIUSPAY (Mobile Money / Card / Apple Pay via hosted checkout) ──
      try {
        await openGeniusPay({
          type,
          amount,
          currency,
          email,
          customer_name: buyer_name,
          customer_phone,
          organization_id,
          campaign_id,
          product_id,
          buyer_name,
          affiliate_code: affiliate_code || undefined,
          promo_code,
          metadata,
        });
        // Browser is being redirected to the GeniusPay checkout page.
      } catch (err) {
        onClose();
        throw err;
      }
      return;
    }

    // ── STRIPE (card payments outside Africa) ──
    const currentUrl = window.location.origin;
    const successUrl = `${currentUrl}/payment/success`;
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
  }, [openGeniusPay]);

  return {
    openPayment,
    // Legacy alias kept so older callers don't break: GeniusPay key is server-side only,
    // so from the client's perspective it is always "available".
    hasPaystackKey: true,
  };
}

