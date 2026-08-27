import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import {
  createPlatformSubscription,
  createPaystackSubscription,
  cancelSubscription,
} from '@/lib/billing/billing.functions';

export type PlanKey = 'pro_monthly' | 'org_monthly' | 'pro_lifetime';
export type PaymentProvider = 'stripe' | 'paystack';

interface CheckoutOptions {
  plan: PlanKey;
  provider: PaymentProvider;
  /** Used by Paystack to pick MoMo currency. Defaults to XOF. */
  currency?: 'XOF' | 'GHS' | 'KES' | 'NGN';
  /** Optional waitlist coupon code (e.g. EARLY-XXXX) for -20% à vie */
  couponCode?: string;
}

/**
 * Hook qui ouvre le checkout de l'abonnement plateforme (Pro / Org / Founder)
 * via Stripe (cartes USD) ou Paystack (MoMo + cartes XOF/GHS/KES).
 */
export function usePlatformCheckout() {
  const [loading, setLoading] = useState(false);
  const runStripeSub = useServerFn(createPlatformSubscription);
  const runPaystackSub = useServerFn(createPaystackSubscription);
  const runCancel = useServerFn(cancelSubscription);

  const startCheckout = async ({ plan, provider, currency = 'XOF', couponCode }: CheckoutOptions) => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/billing/success?plan=${plan}`;
      const cancelUrl = `${origin}/pricing?canceled=1`;

      if (provider === 'stripe') {
        const data: any = await runStripeSub({
          data: { plan_key: plan, success_url: successUrl, cancel_url: cancelUrl, coupon_code: couponCode },
        });
        if (data?.error) throw new Error(data.error);
        if (!data?.url) throw new Error('No checkout URL');
        window.location.href = data.url;
      } else {
        const data: any = await runPaystackSub({
          data: { plan_key: plan, callback_url: successUrl, currency },
        });
        if (data?.error) throw new Error(data.error);
        if (!data?.url) throw new Error('No checkout URL');
        window.location.href = data.url;
      }
    } catch (e: any) {
      console.error('[usePlatformCheckout]', e);
      toast.error(e?.message || 'Impossible de lancer le paiement');
      setLoading(false);
    }
  };

  const cancelSubscription = async (immediate = false) => {
    setLoading(true);
    try {
      const data: any = await runCancel({ data: { immediate } });
      if (data?.error) throw new Error(data.error);
      toast.success(immediate ? 'Abonnement annulé' : 'Annulation programmée à la fin de la période');
      return data;
    } catch (e: any) {
      console.error('[cancel]', e);
      toast.error(e?.message || 'Annulation impossible');
    } finally {
      setLoading(false);
    }
  };

  return { startCheckout, cancelSubscription, loading };
}
