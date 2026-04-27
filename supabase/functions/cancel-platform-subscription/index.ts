// Edge function: cancel-platform-subscription
// Cancels a Stripe or Paystack platform subscription at period end (default)
// or immediately. Authenticated users only.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface Body {
  immediate?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY') || Deno.env.get('PAYSTACK_SECRET_KEY_TEST');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: Body = await req.json().catch(() => ({}));
    const immediate = !!body.immediate;

    const { data: sub } = await db.from('platform_subscriptions')
      .select('*').eq('user_id', user.id).maybeSingle();

    if (!sub) {
      return new Response(JSON.stringify({ error: 'No subscription' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sub.provider === 'founder') {
      return new Response(JSON.stringify({ error: 'Lifetime subscription cannot be canceled' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sub.provider === 'stripe' && sub.stripe_subscription_id && STRIPE_SECRET) {
      const params = new URLSearchParams();
      if (immediate) {
        const r = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
        });
        if (!r.ok) throw new Error(await r.text());
      } else {
        params.append('cancel_at_period_end', 'true');
        const r = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });
        if (!r.ok) throw new Error(await r.text());
      }
    } else if (sub.provider === 'paystack' && sub.paystack_subscription_code && PAYSTACK_SECRET) {
      // Paystack: enable disable subscription via code
      const r = await fetch(`https://api.paystack.co/subscription/disable`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sub.paystack_subscription_code,
          token: sub.metadata?.paystack_email_token || '',
        }),
      });
      if (!r.ok) console.warn('[cancel] paystack disable failed', await r.text());
    }

    await db.from('platform_subscriptions').update({
      cancel_at_period_end: !immediate,
      status: immediate ? 'canceled' : sub.status,
      canceled_at: immediate ? new Date().toISOString() : null,
    }).eq('user_id', user.id);

    return new Response(JSON.stringify({ ok: true, immediate }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[cancel-platform-subscription] error', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
