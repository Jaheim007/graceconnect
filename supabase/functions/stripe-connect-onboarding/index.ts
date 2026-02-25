import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Stripe Connect Express Onboarding
 * 
 * Creates a Stripe Connect Express account for an organization
 * and returns the onboarding link where Stripe handles KYC.
 * 
 * Flow:
 * 1. Create Stripe Connect account (if none exists)
 * 2. Save stripe_account_id to organizations table
 * 3. Generate Account Link (onboarding URL)
 * 4. Redirect vendor to Stripe-hosted onboarding
 * 5. Stripe handles all KYC (identity, bank, etc.)
 * 6. Vendor returns to our app
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

    const { organization_id, return_url, refresh_url } = await req.json();

    if (!organization_id || !return_url) {
      return new Response(JSON.stringify({ error: 'Missing organization_id or return_url' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is admin/owner
    const { data: member } = await db.from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', userId)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: 'Only org owner/admin can configure Stripe Connect' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get org info
    const { data: org } = await db.from('organizations')
      .select('id, name, stripe_account_id, stripe_onboarding_complete, monetization_enabled')
      .eq('id', organization_id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!org.monetization_enabled) {
      return new Response(JSON.stringify({ error: 'Monetization must be enabled first' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let stripeAccountId = org.stripe_account_id;

    // Step 1: Create Stripe Connect Express account if doesn't exist
    if (!stripeAccountId) {
      const accountParams = new URLSearchParams();
      accountParams.append('type', 'express');
      accountParams.append('business_type', 'company');
      accountParams.append('company[name]', org.name);
      accountParams.append('capabilities[card_payments][requested]', 'true');
      accountParams.append('capabilities[transfers][requested]', 'true');
      accountParams.append('metadata[siteviral_org_id]', organization_id);
      accountParams.append('metadata[platform]', 'siteviral');

      const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: accountParams.toString(),
      });

      const accountData = await accountRes.json();

      if (!accountRes.ok) {
        console.error('[stripe-connect-onboarding] Account creation failed:', accountData);
        return new Response(JSON.stringify({ error: accountData.error?.message || 'Failed to create Stripe account' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      stripeAccountId = accountData.id;

      // Save to organizations table
      await db.from('organizations').update({
        stripe_account_id: stripeAccountId,
        stripe_onboarding_complete: false,
      }).eq('id', organization_id);

      // Audit log
      await db.from('audit_logs').insert({
        user_id: userId,
        organization_id,
        action: 'stripe_connect_account_created',
        resource_type: 'organization',
        resource_id: organization_id,
        metadata: { stripe_account_id: stripeAccountId },
      });
    }

    // Step 2: Check if onboarding is already complete
    if (org.stripe_onboarding_complete) {
      // Check current status with Stripe
      const checkRes = await fetch(`https://api.stripe.com/v1/accounts/${stripeAccountId}`, {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
      });
      const checkData = await checkRes.json();

      if (checkData.charges_enabled && checkData.payouts_enabled) {
        return new Response(JSON.stringify({
          ok: true,
          already_complete: true,
          charges_enabled: true,
          payouts_enabled: true,
          stripe_account_id: stripeAccountId,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Step 3: Generate onboarding link
    const effectiveRefreshUrl = refresh_url || return_url;

    const linkParams = new URLSearchParams();
    linkParams.append('account', stripeAccountId!);
    linkParams.append('type', 'account_onboarding');
    linkParams.append('return_url', return_url);
    linkParams.append('refresh_url', effectiveRefreshUrl);

    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: linkParams.toString(),
    });

    const linkData = await linkRes.json();

    if (!linkRes.ok) {
      console.error('[stripe-connect-onboarding] Account link failed:', linkData);
      return new Response(JSON.stringify({ error: linkData.error?.message || 'Failed to create onboarding link' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      onboarding_url: linkData.url,
      stripe_account_id: stripeAccountId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[stripe-connect-onboarding] error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
