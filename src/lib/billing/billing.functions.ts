import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import {
  purchaseCredits,
  updatePurchaseGateway,
  stripeCreditCheckout,
  verifyCreditPurchase,
  createStripePlatformSubscription,
  createPaystackPlatformSubscription,
  cancelPlatformSubscription,
  checkPlatformSubscription,
  type PlanKey,
} from './billing.server';

export const startCreditPurchase = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pack_key: string; payment_gateway?: 'stripe' | 'paystack' }) => input)
  .handler(async ({ data, context }) => {
    const res = await purchaseCredits(context.userId, data.pack_key);
    if ('ok' in res && res.ok && data.payment_gateway === 'paystack') {
      await updatePurchaseGateway(context.userId, res.purchase_id, 'paystack');
    }
    return res;
  });

export const createStripeCreditCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { purchase_id: string; success_url?: string; cancel_url?: string }) => input)
  .handler(async ({ data, context }) =>
    stripeCreditCheckout({
      userId: context.userId,
      purchaseId: data.purchase_id,
      successUrl: data.success_url,
      cancelUrl: data.cancel_url,
    }),
  );

export const verifyCreditPayment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference: string; purchase_id: string; gateway?: string }) => input)
  .handler(async ({ data }) =>
    verifyCreditPurchase({
      reference: data.reference,
      purchaseId: data.purchase_id,
      gateway: data.gateway,
    }),
  );

export const createPlatformSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    plan_key: PlanKey;
    success_url: string;
    cancel_url: string;
    coupon_code?: string;
  }) => input)
  .handler(async ({ data, context }) =>
    createStripePlatformSubscription({
      userId: context.userId,
      planKey: data.plan_key,
      successUrl: data.success_url,
      cancelUrl: data.cancel_url,
      couponCode: data.coupon_code,
    }),
  );

export const createPaystackSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan_key: PlanKey; callback_url: string; currency?: string }) => input)
  .handler(async ({ data, context }) =>
    createPaystackPlatformSubscription({
      userId: context.userId,
      planKey: data.plan_key,
      callbackUrl: data.callback_url,
      currency: data.currency,
    }),
  );

export const cancelSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { immediate?: boolean }) => input)
  .handler(async ({ data, context }) =>
    cancelPlatformSubscription(context.userId, !!data.immediate),
  );

export const checkSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => checkPlatformSubscription(context.userId));
