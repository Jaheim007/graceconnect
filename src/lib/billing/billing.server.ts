// Server-only billing logic: AI credit pack purchases and platform subscriptions
// (Pro / Org / Founder lifetime). Ported from the Supabase edge functions
// purchase-credits, stripe-credit-checkout, verify-credit-purchase,
// create-platform-subscription, create-paystack-subscription,
// cancel-platform-subscription and check-platform-subscription.
// Worker-friendly: Stripe / Paystack are called through their REST APIs.

import { adminDb, getAuthUser, type AnyDb } from '@/lib/verticals/payments.server';

const ZERO_DECIMAL_CURRENCIES = [
  'XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF',
  'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV',
];

function stripeSecret(): string {
  return process.env['STRIPE_SECRET_KEY'] || '';
}

function paystackSecret(): string {
  const mode = process.env['VITE_PAYSTACK_MODE'] || 'live';
  return (
    (mode === 'test'
      ? process.env['PAYSTACK_SECRET_KEY_TEST']
      : process.env['PAYSTACK_SECRET_KEY']) || ''
  );
}

async function stripeForm(path: string, params: Record<string, string>, method = 'POST') {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  return { ok: res.ok, json: await res.json().catch(() => null) as any };
}

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${stripeSecret()}` },
  });
  return { ok: res.ok, json: await res.json().catch(() => null) as any };
}

/* ────────────────────────────── credits ────────────────────────────── */

export async function purchaseCredits(userId: string, packKey: string) {
  if (!packKey) return { error: 'pack_key is required' };
  const db = await adminDb();

  const { data: pack } = await db
    .from('credit_packs')
    .select('*')
    .eq('pack_key', packKey)
    .eq('is_active', true)
    .maybeSingle();
  if (!pack) return { error: 'Pack not found or inactive' };

  const user = await getAuthUser(db, userId);
  if (!user) return { error: 'User not found' };

  const bonus = Math.round((pack.credits * (pack.bonus_percent || 0)) / 100);
  const totalCredits = pack.credits + bonus;

  const { data: purchase, error: purchaseErr } = await db
    .from('credit_purchases')
    .insert({
      user_id: userId,
      pack_key: pack.pack_key,
      credits_amount: totalCredits,
      price_amount: pack.price_xof,
      price_currency: 'XOF',
      payment_gateway: 'stripe',
      status: 'pending',
    })
    .select('id')
    .single();
  if (purchaseErr || !purchase) {
    console.error('[purchase-credits] insert failed', purchaseErr);
    return { error: 'Failed to create purchase record' };
  }

  return {
    ok: true,
    purchase_id: purchase.id as string,
    email: user.email,
    amount: pack.price_xof as number,
    currency: 'XOF',
    credits: totalCredits,
    pack_name: pack.name as string,
    metadata: {
      purchase_id: purchase.id,
      pack_key: pack.pack_key,
      credits: totalCredits,
      type: 'credit_purchase',
      user_id: userId,
    },
  };
}

export async function updatePurchaseGateway(
  userId: string,
  purchaseId: string,
  gateway: 'stripe' | 'paystack',
) {
  const db = await adminDb();
  await db
    .from('credit_purchases')
    .update({ payment_gateway: gateway })
    .eq('id', purchaseId)
    .eq('user_id', userId);
}

export async function stripeCreditCheckout(args: {
  userId: string;
  purchaseId: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  if (!args.purchaseId) return { error: 'purchase_id is required' };
  if (!stripeSecret()) return { error: 'Stripe not configured' };

  const db = await adminDb();
  const { data: purchase } = await db
    .from('credit_purchases')
    .select('*')
    .eq('id', args.purchaseId)
    .eq('user_id', args.userId)
    .eq('status', 'pending')
    .maybeSingle();
  if (!purchase) return { error: 'Purchase not found or already completed' };

  const user = await getAuthUser(db, args.userId);
  if (!user?.email) return { error: 'User not found' };

  const { data: pack } = await db
    .from('credit_packs')
    .select('name')
    .eq('pack_key', purchase.pack_key)
    .maybeSingle();

  const currency = String(purchase.price_currency || 'XOF').toUpperCase();
  const amount = ZERO_DECIMAL_CURRENCIES.includes(currency)
    ? Math.round(purchase.price_amount)
    : Math.round(purchase.price_amount * 100);

  const baseSuccess = (args.successUrl || 'https://siteviral.com/credits').replace(/\/$/, '');
  const successUrl = `${baseSuccess}${baseSuccess.includes('?') ? '&' : '?'}credit_purchase_id=${args.purchaseId}&stripe_session_id={CHECKOUT_SESSION_ID}`;

  const params: Record<string, string> = {
    mode: 'payment',
    customer_email: user.email,
    success_url: successUrl,
    cancel_url: args.cancelUrl || baseSuccess,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(amount),
    'line_items[0][price_data][product_data][name]':
      `${purchase.credits_amount} Crédits IA — ${pack?.name || purchase.pack_key}`,
    'metadata[type]': 'credit_purchase',
    'metadata[purchase_id]': args.purchaseId,
    'metadata[pack_key]': String(purchase.pack_key),
    'metadata[credits]': String(purchase.credits_amount),
    'metadata[user_id]': args.userId,
  };

  const { ok, json: session } = await stripeForm('checkout/sessions', params);
  if (!ok || !session?.url) {
    console.error('[stripe-credit-checkout] stripe fail', session?.error?.message);
    return { error: session?.error?.message || 'Stripe error' };
  }
  return { ok: true, checkout_url: session.url as string, session_id: session.id as string };
}

export async function verifyCreditPurchase(args: {
  reference: string;
  purchaseId: string;
  gateway?: string;
}) {
  if (!args.reference || !args.purchaseId) {
    return { error: 'reference and purchase_id are required' };
  }
  const db = await adminDb();
  const gateway = args.gateway || 'paystack';

  if (gateway === 'stripe') {
    if (!stripeSecret()) return { error: 'Stripe not configured' };
    const { json: session } = await stripeGet(
      `checkout/sessions/${encodeURIComponent(args.reference)}`,
    );
    if (session?.payment_status !== 'paid') {
      await db
        .from('credit_purchases')
        .update({ status: 'failed', payment_reference: args.reference })
        .eq('id', args.purchaseId);
      return { error: 'Stripe payment not completed', details: session?.payment_status };
    }
  } else {
    const secret = paystackSecret();
    if (!secret) return { error: 'Paystack not configured' };
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(args.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const payload = await res.json().catch(() => null) as any;
    const verified = payload?.status && payload?.data?.status === 'success';
    if (!verified) {
      await db
        .from('credit_purchases')
        .update({ status: 'failed', payment_reference: args.reference })
        .eq('id', args.purchaseId);
      return { error: 'Payment not verified', details: payload?.data?.gateway_response };
    }
    const meta = payload?.data?.metadata || {};
    if (meta.purchase_id !== args.purchaseId || meta.type !== 'credit_purchase') {
      return { error: 'Payment metadata mismatch' };
    }
  }

  const { data: result, error: completeErr } = await (db as any).rpc('complete_credit_purchase', {
    _purchase_id: args.purchaseId,
    _payment_reference: args.reference,
  });
  if (completeErr) {
    console.error('[verify-credit-purchase] complete failed', completeErr);
    return { error: 'Failed to grant credits: ' + completeErr.message };
  }
  const res = (Array.isArray(result) ? result[0] : result) || {};

  const { data: purchase } = await db
    .from('credit_purchases')
    .select('user_id, pack_key, credits_amount')
    .eq('id', args.purchaseId)
    .maybeSingle();
  if (purchase) {
    await db.from('user_notifications').insert({
      user_id: purchase.user_id,
      title: '💰 Crédits reçus !',
      body: `Vous avez reçu ${purchase.credits_amount} crédits IA. Bon usage créatif !`,
      notification_type: 'credit_purchase',
      action_url: '/credits',
    });
  }

  return { ok: true, credits: res.credits, balance: res.balance };
}

/* ───────────────────── platform subscriptions ───────────────────── */

export const STRIPE_PRICING = {
  pro_monthly: { amount_usd: 3100, label: 'SiteViral Pro', interval: 'month' as const, plan: 'pro' as const },
  org_monthly: { amount_usd: 8000, label: 'SiteViral Organisation', interval: 'month' as const, plan: 'org' as const },
  pro_lifetime: { amount_usd: 8000, label: 'SiteViral Pro – Founder Lifetime', interval: null, plan: 'pro' as const },
};

export const PAYSTACK_PRICING = {
  pro_monthly: { amount_xof: 19000, label: 'SiteViral Pro', interval: 'monthly' as const, plan: 'pro' as const },
  org_monthly: { amount_xof: 49000, label: 'SiteViral Organisation', interval: 'monthly' as const, plan: 'org' as const },
  pro_lifetime: { amount_xof: 49000, label: 'SiteViral Pro – Founder Lifetime', interval: null, plan: 'pro' as const },
};

export type PlanKey = keyof typeof STRIPE_PRICING;

async function resolveStripeCoupon(
  db: AnyDb,
  inputCode: string,
  userId: string,
): Promise<string | null> {
  if (!inputCode) return null;
  const { data: row } = await db
    .from('waitlist_coupons')
    .select('id, code, stripe_coupon_id, discount_percent, redeemed_at')
    .eq('code', inputCode.toUpperCase())
    .eq('user_id', userId)
    .maybeSingle();

  if (!row) return inputCode;
  if (row.redeemed_at) throw new Error('Coupon already redeemed');

  let couponId = row.stripe_coupon_id as string | null;
  if (!couponId) {
    const { json: created } = await stripeForm('coupons', {
      id: row.code,
      percent_off: String(row.discount_percent),
      duration: 'forever',
      name: `SiteViral early-adopter ${row.discount_percent}% off`,
    });
    if (created?.id) {
      couponId = created.id;
    } else {
      const { json: existing } = await stripeGet(`coupons/${encodeURIComponent(row.code)}`);
      if (!existing?.id) throw new Error('Stripe coupon create failed');
      couponId = existing.id;
    }
    await db.from('waitlist_coupons').update({ stripe_coupon_id: couponId }).eq('id', row.id);
  }

  await db
    .from('waitlist_coupons')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('id', row.id);
  return couponId;
}

export async function createStripePlatformSubscription(args: {
  userId: string;
  planKey: PlanKey;
  successUrl: string;
  cancelUrl: string;
  couponCode?: string;
}) {
  if (!stripeSecret()) return { error: 'Stripe not configured' };
  const config = STRIPE_PRICING[args.planKey];
  if (!config) return { error: 'Invalid plan_key' };
  if (!args.successUrl || !args.cancelUrl) return { error: 'Missing URLs' };

  const db = await adminDb();
  const user = await getAuthUser(db, args.userId);
  if (!user?.email) return { error: 'User not found' };

  if (args.planKey === 'pro_lifetime') {
    const { data: remaining } = await (db as any).rpc('founders_remaining');
    if (!remaining || remaining <= 0) return { error: 'No founder slots remaining' };
  }

  // Find or create the Stripe customer
  const { json: search } = await stripeGet(
    `customers/search?query=${encodeURIComponent(`email:'${user.email}'`)}&limit=1`,
  );
  let customerId: string | undefined = search?.data?.[0]?.id;
  if (!customerId) {
    const { json: created } = await stripeForm('customers', {
      email: user.email,
      'metadata[user_id]': args.userId,
    });
    if (!created?.id) return { error: 'Customer create failed' };
    customerId = created.id;
  }

  const params: Record<string, string> = {
    customer: customerId!,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    'metadata[user_id]': args.userId,
    'metadata[plan_key]': args.planKey,
    'metadata[platform_subscription]': 'true',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(config.amount_usd),
    'line_items[0][price_data][product_data][name]': config.label,
  };

  if (config.interval) {
    params.mode = 'subscription';
    params['line_items[0][price_data][recurring][interval]'] = config.interval;
    params['subscription_data[trial_period_days]'] = '14';
    params['subscription_data[metadata][user_id]'] = args.userId;
    params['subscription_data[metadata][plan_key]'] = args.planKey;
  } else {
    params.mode = 'payment';
    params['payment_intent_data[metadata][user_id]'] = args.userId;
    params['payment_intent_data[metadata][plan_key]'] = args.planKey;
    params['payment_intent_data[metadata][founder_lifetime]'] = 'true';
  }

  if (args.couponCode && config.interval) {
    try {
      const couponId = await resolveStripeCoupon(db, args.couponCode, args.userId);
      if (couponId) {
        params['discounts[0][coupon]'] = couponId;
        params['metadata[coupon_code]'] = args.couponCode;
        params['subscription_data[metadata][coupon_code]'] = args.couponCode;
      }
    } catch (e: any) {
      return { error: e?.message || 'Invalid coupon' };
    }
  }

  const { ok, json: session } = await stripeForm('checkout/sessions', params);
  if (!ok || !session?.url) {
    console.error('[create-platform-subscription] stripe fail', session?.error?.message);
    return { error: session?.error?.message || 'Checkout failed' };
  }

  if (config.interval) {
    await db.from('platform_subscriptions').upsert(
      {
        user_id: args.userId,
        plan: config.plan,
        status: 'incomplete',
        provider: 'stripe',
        stripe_customer_id: customerId,
        amount_xof: args.planKey === 'pro_monthly' ? 19000 : 49000,
        currency: 'USD',
        billing_interval: config.interval,
        coupon_code: args.couponCode || null,
        metadata: {
          plan_key: args.planKey,
          checkout_session_id: session.id,
          coupon_code: args.couponCode || null,
        },
      },
      { onConflict: 'user_id' },
    );
  }

  return { url: session.url as string, session_id: session.id as string };
}

export async function createPaystackPlatformSubscription(args: {
  userId: string;
  planKey: PlanKey;
  callbackUrl: string;
  currency?: string;
}) {
  const secret = paystackSecret();
  if (!secret) return { error: 'Paystack not configured' };
  const config = PAYSTACK_PRICING[args.planKey];
  if (!config) return { error: 'Invalid plan_key' };

  const db = await adminDb();
  const user = await getAuthUser(db, args.userId);
  if (!user?.email) return { error: 'User not found' };

  const currency = args.currency || 'XOF';

  if (args.planKey === 'pro_lifetime') {
    const { data: remaining } = await (db as any).rpc('founders_remaining');
    if (!remaining || remaining <= 0) return { error: 'No founder slots remaining' };
  }

  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const reference = `SV-PSUB-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      amount: config.interval ? 100 : config.amount_xof * 100,
      currency,
      reference,
      callback_url: args.callbackUrl,
      metadata: {
        user_id: args.userId,
        plan_key: args.planKey,
        plan: config.plan,
        interval: config.interval,
        amount_xof: config.amount_xof,
        platform_subscription: true,
        trial_end: config.interval ? trialEnd.toISOString() : null,
        founder_lifetime: args.planKey === 'pro_lifetime',
      },
      channels: currency === 'XOF' ? ['mobile_money', 'card'] : ['card', 'mobile_money', 'bank'],
    }),
  });
  const init = await res.json().catch(() => null) as any;
  if (!init?.status || !init?.data?.authorization_url) {
    console.error('[create-paystack-subscription] init failed', init);
    return { error: `Paystack init failed: ${init?.message || 'unknown'}` };
  }

  if (config.interval) {
    await db.from('platform_subscriptions').upsert(
      {
        user_id: args.userId,
        plan: config.plan,
        status: 'incomplete',
        provider: 'paystack',
        amount_xof: config.amount_xof,
        currency,
        billing_interval: config.interval,
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString(),
        metadata: { plan_key: args.planKey, paystack_reference: reference },
      },
      { onConflict: 'user_id' },
    );
  }

  return {
    url: init.data.authorization_url as string,
    reference: init.data.reference as string,
    access_code: init.data.access_code as string,
  };
}

export async function cancelPlatformSubscription(userId: string, immediate: boolean) {
  const db = await adminDb();
  const { data: sub } = await db
    .from('platform_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!sub) return { error: 'No subscription' };
  if (sub.provider === 'founder') return { error: 'Lifetime subscription cannot be canceled' };

  if (sub.provider === 'stripe' && sub.stripe_subscription_id && stripeSecret()) {
    if (immediate) {
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${stripeSecret()}` },
      });
      if (!res.ok) return { error: await res.text() };
    } else {
      const { ok, json } = await stripeForm(
        `subscriptions/${sub.stripe_subscription_id}`,
        { cancel_at_period_end: 'true' },
      );
      if (!ok) return { error: json?.error?.message || 'Stripe error' };
    }
  } else if (sub.provider === 'paystack' && sub.paystack_subscription_code && paystackSecret()) {
    const res = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${paystackSecret()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: sub.paystack_subscription_code,
        token: sub.metadata?.paystack_email_token || '',
      }),
    });
    if (!res.ok) console.warn('[cancel] paystack disable failed', await res.text());
  }

  await db
    .from('platform_subscriptions')
    .update({
      cancel_at_period_end: !immediate,
      status: immediate ? 'canceled' : sub.status,
      canceled_at: immediate ? new Date().toISOString() : null,
    })
    .eq('user_id', userId);

  return { ok: true, immediate };
}

export async function checkPlatformSubscription(userId: string) {
  const db = await adminDb();

  const { data: existing } = await db
    .from('platform_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (stripeSecret() && existing?.stripe_customer_id) {
    try {
      const { json: subsData } = await stripeGet(
        `subscriptions?customer=${existing.stripe_customer_id}&status=all&limit=1`,
      );
      const sub = subsData?.data?.[0];
      if (sub) {
        const statusMap: Record<string, string> = {
          trialing: 'trialing', active: 'active', past_due: 'past_due',
          canceled: 'canceled', incomplete: 'incomplete', incomplete_expired: 'expired',
          unpaid: 'past_due', paused: 'past_due',
        };
        await db
          .from('platform_subscriptions')
          .update({
            stripe_subscription_id: sub.id,
            status: statusMap[sub.status] || sub.status,
            current_period_start: sub.current_period_start
              ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: sub.cancel_at_period_end,
            trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          })
          .eq('user_id', userId);
      }
    } catch (e) {
      console.warn('[check-platform-subscription] stripe sync skipped', e);
    }
  }

  const { data: tier } = await (db as any).rpc('get_user_platform_tier', { _user_id: userId });
  const { data: row } = await db
    .from('platform_subscriptions')
    .select('plan, status, current_period_end, trial_end, cancel_at_period_end, provider')
    .eq('user_id', userId)
    .maybeSingle();
  const { data: founder } = await db
    .from('founders_lifetime')
    .select('slot_number')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    subscribed: tier !== 'free',
    tier: tier || 'free',
    subscription: row || null,
    founder_slot: founder?.slot_number || null,
  };
}
