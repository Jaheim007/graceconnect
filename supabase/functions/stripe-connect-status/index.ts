import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Check Stripe Connect account status.
 * Called when vendor returns from Stripe onboarding to verify completion.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
  if (!STRIPE_SECRET) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub;

    const { organization_id } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'Missing organization_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is member
    const { data: member } = await db.from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', userId)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get org
    const { data: org } = await db.from('organizations')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', organization_id)
      .single();

    if (!org?.stripe_account_id) {
      return new Response(JSON.stringify({
        ok: true,
        has_account: false,
        charges_enabled: false,
        payouts_enabled: false,
        onboarding_complete: false,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check with Stripe
    const accountRes = await fetch(`https://api.stripe.com/v1/accounts/${org.stripe_account_id}`, {
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
    });
    const account = await accountRes.json();

    const chargesEnabled = account.charges_enabled === true;
    const payoutsEnabled = account.payouts_enabled === true;
    const detailsSubmitted = account.details_submitted === true;
    const onboardingComplete = chargesEnabled && payoutsEnabled;

    // Update local status if it changed
    if (onboardingComplete && !org.stripe_onboarding_complete) {
      await db.from('organizations').update({
        stripe_onboarding_complete: true,
      }).eq('id', organization_id);

      await db.from('audit_logs').insert({
        user_id: userId,
        organization_id,
        action: 'stripe_connect_onboarding_complete',
        resource_type: 'organization',
        resource_id: organization_id,
        metadata: { stripe_account_id: org.stripe_account_id },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      has_account: true,
      stripe_account_id: org.stripe_account_id,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted,
      onboarding_complete: onboardingComplete,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[stripe-connect-status] error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
