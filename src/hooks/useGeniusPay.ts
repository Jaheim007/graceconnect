// useGeniusPay — calls the geniuspay-init edge function and redirects
// the browser to GeniusPay's hosted checkout (Wave, Orange, MTN, Moov, card).
//
// Reference returned by GeniusPay is `MTX-...`. We store it in
// `paystack_reference` columns (legacy column name, kept for migration simplicity).
import { useCallback } from 'react';
import { callFn } from '@/lib/api';

export interface GeniusPayInitParams {
  amount: number;
  currency?: string; // XOF / EUR / USD
  email: string;
  customer_name?: string;
  customer_phone?: string;
  description?: string;
  type: 'donation' | 'product' | 'credit_purchase' | 'template_clone' | 'platform_subscription';
  organization_id?: string;
  campaign_id?: string;
  product_id?: string;
  purchase_id?: string;
  buyer_name?: string;
  affiliate_code?: string | null;
  promo_code?: string;
  metadata?: Record<string, unknown>;
}

export interface GeniusPayInitResult {
  ok: true;
  checkout_url: string;
  reference: string;
  amount: number;
  currency: string;
  environment: 'sandbox' | 'live';
}

export function useGeniusPay() {
  const openCheckout = useCallback(async (params: GeniusPayInitParams) => {
    const result = await callFn('geniuspay-init', {
      ...params,
      return_origin: window.location.origin,
    }, true) as GeniusPayInitResult | { error: string };

    if (!('ok' in result) || !result.checkout_url) {
      const msg = (result as any)?.error || 'GeniusPay initialization failed';
      throw new Error(msg);
    }

    // Redirect the buyer to GeniusPay's hosted checkout page.
    window.location.href = result.checkout_url;
    return result;
  }, []);

  return { openCheckout };
}
