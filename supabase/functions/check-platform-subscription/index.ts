// Edge function: check-platform-subscription
// Resolves the active platform tier for the authenticated user.
// Used by the frontend to refresh subscription state after checkout.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ subscribed: false, tier: 'free' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ subscribed: false, tier: 'free' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Best-effort Stripe sync: refresh latest subscription status from Stripe directly,
    // in case the webhook hasn't landed yet.
    const { data: existing } = await db
      .from('platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (STRIPE_SECRET && existing?.stripe_customer_id) {
      try {
        const subsRes = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${existing.stripe_customer_id}&status=all&limit=1`,
          { headers: { Authorization: `Bearer ${STRIPE_SECRET}` } }
        );
        const subsData = await subsRes.json();
        const sub = subsData?.data?.[0];
        if (sub) {
          const statusMap: Record<string, string> = {
            trialing: 'trialing', active: 'active', past_due: 'past_due',
            canceled: 'canceled', incomplete: 'incomplete', incomplete_expired: 'expired',
            unpaid: 'past_due', paused: 'past_due',
          };
          await db.from('platform_subscriptions').update({
            stripe_subscription_id: sub.id,
            status: statusMap[sub.status] || sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          }).eq('user_id', user.id);
        }
      } catch (e) {
        console.warn('[check-platform-subscription] Stripe sync skipped', e);
      }
    }

    // Resolve final tier via DB function
    const { data: tier } = await db.rpc('get_user_platform_tier', { _user_id: user.id });
    const { data: row } = await db
      .from('platform_subscriptions')
      .select('plan, status, current_period_end, trial_end, cancel_at_period_end, provider')
      .eq('user_id', user.id)
      .maybeSingle();
    const { data: founder } = await db
      .from('founders_lifetime')
      .select('slot_number')
      .eq('user_id', user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      subscribed: tier !== 'free',
      tier: tier || 'free',
      subscription: row || null,
      founder_slot: founder?.slot_number || null,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[check-platform-subscription] error', error);
    return new Response(JSON.stringify({ subscribed: false, tier: 'free', error: error?.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
