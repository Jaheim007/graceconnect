// Edge function: create-platform-subscription
// Creates a Stripe Checkout subscription session for Pro / Org plans
// with a 14-day free trial. Authenticated users only.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// XOF -> USD approx (Stripe doesn't support XOF for cards)
// 19 000 XOF ≈ 31 USD ; 49 000 XOF ≈ 80 USD ; 49 000 XOF founder lifetime ≈ 80 USD
const PRICING = {
  pro_monthly: { amount_usd: 3100, label: 'SiteViral Pro', interval: 'month' as const, plan: 'pro' as const },
  org_monthly: { amount_usd: 8000, label: 'SiteViral Organisation', interval: 'month' as const, plan: 'org' as const },
  pro_lifetime: { amount_usd: 8000, label: 'SiteViral Pro – Founder Lifetime', interval: null, plan: 'pro' as const },
};

type PlanKey = keyof typeof PRICING;

interface Body {
  plan_key: PlanKey;
  success_url: string;
  cancel_url: string;
  coupon_code?: string; // Code waitlist (EARLY-XXXX) ou code Stripe direct
}

/**
 * Convert a SiteViral waitlist coupon code into a Stripe coupon ID.
 * - If the code matches a row in `waitlist_coupons` (and isn't redeemed),
 *   ensure a matching Stripe coupon exists (create on the fly), and mark redeemed.
 * - Otherwise, treat the input as a raw Stripe coupon ID and return as-is.
 */
async function resolveStripeCoupon(
  db: any,
  stripeSecret: string,
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

  if (!row) {
    // Treat as a raw Stripe coupon ID — Stripe will reject if invalid.
    return inputCode;
  }

  if (row.redeemed_at) {
    throw new Error('Coupon already redeemed');
  }

  let stripeCouponId = row.stripe_coupon_id as string | null;

  if (!stripeCouponId) {
    // Create a forever-percent coupon in Stripe for this code.
    const couponRes = await fetch('https://api.stripe.com/v1/coupons', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id: row.code, // reuse our own code as the Stripe coupon ID
        percent_off: String(row.discount_percent),
        duration: 'forever',
        name: `SiteViral early-adopter ${row.discount_percent}% off`,
      }),
    });
    const created = await couponRes.json();
    if (!created?.id) {
      // Coupon may already exist with that ID — try to fetch it
      const fetchRes = await fetch(
        `https://api.stripe.com/v1/coupons/${encodeURIComponent(row.code)}`,
        { headers: { Authorization: `Bearer ${stripeSecret}` } },
      );
      const existing = await fetchRes.json();
      if (!existing?.id) throw new Error(`Stripe coupon create failed: ${JSON.stringify(created)}`);
      stripeCouponId = existing.id;
    } else {
      stripeCouponId = created.id;
    }
    await db.from('waitlist_coupons').update({ stripe_coupon_id: stripeCouponId }).eq('id', row.id);
  }

  // Mark redeemed (best-effort — webhook on first invoice will keep status in sync)
  await db.from('waitlist_coupons').update({ redeemed_at: new Date().toISOString() }).eq('id', row.id);
  return stripeCouponId;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!STRIPE_SECRET) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: Body = await req.json();
    const config = PRICING[body.plan_key];
    if (!config) {
      return new Response(JSON.stringify({ error: 'Invalid plan_key' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.success_url || !body.cancel_url) {
      return new Response(JSON.stringify({ error: 'Missing URLs' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For founder lifetime, check slot availability
    if (body.plan_key === 'pro_lifetime') {
      const { data: remaining } = await db.rpc('founders_remaining');
      if (!remaining || remaining <= 0) {
        return new Response(JSON.stringify({ error: 'No founder slots remaining' }), {
          status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Find/create Stripe customer
    const customerSearch = await fetch(
      `https://api.stripe.com/v1/customers/search?query=${encodeURIComponent(`email:'${user.email}'`)}&limit=1`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET}` } }
    );
    const searchData = await customerSearch.json();
    let customerId = searchData?.data?.[0]?.id as string | undefined;

    if (!customerId) {
      const createCustomer = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email,
          'metadata[user_id]': user.id,
        }),
      });
      const created = await createCustomer.json();
      if (!created?.id) throw new Error(`Customer create failed: ${JSON.stringify(created)}`);
      customerId = created.id;
    }

    // Build Checkout Session
    const sessionParams: Record<string, string> = {
      customer: customerId!,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      'metadata[user_id]': user.id,
      'metadata[plan_key]': body.plan_key,
      'metadata[platform_subscription]': 'true',
    };

    if (config.interval) {
      // Subscription with 14-day trial
      sessionParams.mode = 'subscription';
      sessionParams['line_items[0][price_data][currency]'] = 'usd';
      sessionParams['line_items[0][price_data][unit_amount]'] = String(config.amount_usd);
      sessionParams['line_items[0][price_data][product_data][name]'] = config.label;
      sessionParams['line_items[0][price_data][recurring][interval]'] = config.interval;
      sessionParams['line_items[0][quantity]'] = '1';
      sessionParams['subscription_data[trial_period_days]'] = '14';
      sessionParams['subscription_data[metadata][user_id]'] = user.id;
      sessionParams['subscription_data[metadata][plan_key]'] = body.plan_key;
    } else {
      // One-time payment (founder lifetime)
      sessionParams.mode = 'payment';
      sessionParams['line_items[0][price_data][currency]'] = 'usd';
      sessionParams['line_items[0][price_data][unit_amount]'] = String(config.amount_usd);
      sessionParams['line_items[0][price_data][product_data][name]'] = config.label;
      sessionParams['line_items[0][quantity]'] = '1';
      sessionParams['payment_intent_data[metadata][user_id]'] = user.id;
      sessionParams['payment_intent_data[metadata][plan_key]'] = body.plan_key;
      sessionParams['payment_intent_data[metadata][founder_lifetime]'] = 'true';
    }

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(sessionParams),
    });
    const session = await sessionRes.json();
    if (!session?.url) {
      console.error('[create-platform-subscription] Stripe error', session);
      throw new Error(`Checkout failed: ${JSON.stringify(session)}`);
    }

    // Pre-record subscription as 'incomplete' so we have a row
    if (config.interval) {
      await db.from('platform_subscriptions').upsert({
        user_id: user.id,
        plan: config.plan,
        status: 'incomplete',
        provider: 'stripe',
        stripe_customer_id: customerId,
        amount_xof: body.plan_key === 'pro_monthly' ? 19000 : 49000,
        currency: 'USD',
        billing_interval: config.interval,
        metadata: { plan_key: body.plan_key, checkout_session_id: session.id },
      }, { onConflict: 'user_id' });
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[create-platform-subscription] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
