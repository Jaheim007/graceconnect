// Edge function: create-paystack-subscription
// Creates a Paystack subscription for Pro / Org plans (MoMo + cards in West/East Africa)
// Paystack handles trial via "start_date" delay.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Pricing in XOF (Paystack supports XOF for some merchants; fallback to NGN/GHS)
// 1 EUR ≈ 656 XOF ; 1 USD ≈ 600 XOF
const PRICING = {
  pro_monthly: { amount_xof: 19000, label: 'SiteViral Pro', interval: 'monthly' as const, plan: 'pro' as const },
  org_monthly: { amount_xof: 49000, label: 'SiteViral Organisation', interval: 'monthly' as const, plan: 'org' as const },
  pro_lifetime: { amount_xof: 49000, label: 'SiteViral Pro – Founder Lifetime', interval: null, plan: 'pro' as const },
};

type PlanKey = keyof typeof PRICING;

interface Body {
  plan_key: PlanKey;
  callback_url: string;
  currency?: 'XOF' | 'GHS' | 'KES' | 'NGN';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY') || Deno.env.get('PAYSTACK_SECRET_KEY_TEST');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!PAYSTACK_SECRET) {
    return new Response(JSON.stringify({ error: 'Paystack not configured' }), {
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

    const currency = body.currency || 'XOF';

    // Founder slot check
    if (body.plan_key === 'pro_lifetime') {
      const { data: remaining } = await db.rpc('founders_remaining');
      if (!remaining || remaining <= 0) {
        return new Response(JSON.stringify({ error: 'No founder slots remaining' }), {
          status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Compute trial start_date for subscriptions: 14 days from now (Paystack only charges then)
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const reference = `SV-PSUB-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Initialize transaction. For subscriptions we use Paystack "plan" pattern:
    // we create a one-off authorization charge of 100 XOF and then convert to subscription via plan_code on success.
    // Simpler approach: initialize a transaction with metadata, and use the success webhook to create the subscription.
    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: config.interval ? 100 : config.amount_xof * 100, // Authorization charge for subs (100 XOF refunded), full charge for lifetime
        currency,
        reference,
        callback_url: body.callback_url,
        metadata: {
          user_id: user.id,
          plan_key: body.plan_key,
          plan: config.plan,
          interval: config.interval,
          amount_xof: config.amount_xof,
          platform_subscription: true,
          trial_end: config.interval ? trialEnd.toISOString() : null,
          founder_lifetime: body.plan_key === 'pro_lifetime',
        },
        channels: currency === 'XOF' ? ['mobile_money', 'card'] : ['card', 'mobile_money', 'bank'],
      }),
    });

    const initData = await initRes.json();
    if (!initData?.status || !initData?.data?.authorization_url) {
      console.error('[create-paystack-subscription] init failed', initData);
      throw new Error(`Paystack init failed: ${initData?.message || 'unknown'}`);
    }

    // Pre-record incomplete subscription
    if (config.interval) {
      await db.from('platform_subscriptions').upsert({
        user_id: user.id,
        plan: config.plan,
        status: 'incomplete',
        provider: 'paystack',
        amount_xof: config.amount_xof,
        currency,
        billing_interval: config.interval,
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString(),
        metadata: { plan_key: body.plan_key, paystack_reference: reference },
      }, { onConflict: 'user_id' });
    }

    return new Response(JSON.stringify({
      url: initData.data.authorization_url,
      reference: initData.data.reference,
      access_code: initData.data.access_code,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[create-paystack-subscription] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
