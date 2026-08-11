import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const PAYSTACK_SECRET = getPaystackSecretKey();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub;

    const { organization_id, business_name, settlement_bank, account_number, country_code, payout_method, momo_provider, momo_number } = await req.json();

    if (!organization_id || !business_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields: organization_id, business_name' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify user is admin/owner of org
    const { data: member } = await db.from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', userId)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: 'Only org owner/admin can configure payouts' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check KYC approved
    const { data: org } = await db.from('organizations').select('monetization_enabled, kyc_status, paystack_subaccount_code, country_code').eq('id', organization_id).single();
    if (!org?.monetization_enabled) {
      return new Response(JSON.stringify({ error: 'Monetization must be enabled first' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check country support
    const orgCountry = country_code || org.country_code || 'CI';
    const { data: countrySupport } = await db.from('supported_payout_countries')
      .select('*')
      .eq('country_code', orgCountry)
      .maybeSingle();

    if (!countrySupport?.paystack_supported) {
      return new Response(JSON.stringify({ error: `Country ${orgCountry} is not supported for monetization` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate payout method against country support
    const effectivePayoutMethod = payout_method || 'bank';
    if (effectivePayoutMethod === 'mobile_money' && !countrySupport.momo_payout) {
      return new Response(JSON.stringify({ error: `Mobile Money payout is not supported in ${countrySupport.country_name}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If subaccount already exists, return it
    if (org.paystack_subaccount_code) {
      return new Response(JSON.stringify({ ok: true, subaccount_code: org.paystack_subaccount_code, existing: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate bank details
    if (effectivePayoutMethod === 'bank') {
      if (!settlement_bank || !account_number) {
        return new Response(JSON.stringify({ error: 'Bank details required: settlement_bank, account_number' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else if (effectivePayoutMethod === 'mobile_money') {
      if (!momo_provider || !momo_number) {
        return new Response(JSON.stringify({ error: 'Mobile Money details required: momo_provider, momo_number' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Build Paystack subaccount payload
    // For MoMo: use the MoMo provider as settlement_bank and phone as account_number
    const paystackPayload: Record<string, unknown> = {
      business_name,
      percentage_charge: 0, // platform handles the split via transaction_charge
      settlement_schedule: 'manual', // CRITICAL: manual settlement for escrow control
    };

    if (effectivePayoutMethod === 'mobile_money') {
      paystackPayload.settlement_bank = momo_provider; // e.g. 'orange-ci', 'mtn-gh'
      paystackPayload.account_number = momo_number;
    } else {
      paystackPayload.settlement_bank = settlement_bank;
      paystackPayload.account_number = account_number;
    }

    // Create Paystack subaccount
    const psRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(paystackPayload),
    });
    const psData = await psRes.json();

    if (!psData.status) {
      console.error('Paystack subaccount creation failed:', psData);
      return new Response(JSON.stringify({ error: 'Paystack subaccount creation failed', detail: psData.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subaccountCode = psData.data.subaccount_code;

    // Save non-sensitive routing info on the organization
    await db.from('organizations').update({
      paystack_subaccount_code: subaccountCode,
      country_code: orgCountry,
      payout_method: effectivePayoutMethod,
    }).eq('id', organization_id);

    // Sensitive Mobile Money details live in a private, owner-only table
    await db.from('org_payout_accounts').upsert({
      organization_id,
      momo_provider: effectivePayoutMethod === 'mobile_money' ? momo_provider : null,
      momo_number: effectivePayoutMethod === 'mobile_money' ? momo_number : null,
    }, { onConflict: 'organization_id' });

    // Audit log
    await db.from('audit_logs').insert({
      user_id: userId,
      organization_id,
      action: 'subaccount_created',
      resource_type: 'organization',
      resource_id: organization_id,
      metadata: {
        subaccount_code: subaccountCode,
        country_code: orgCountry,
        payout_method: effectivePayoutMethod,
        settlement_schedule: 'manual',
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      subaccount_code: subaccountCode,
      settlement_schedule: 'manual',
      payout_method: effectivePayoutMethod,
      country_code: orgCountry,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('create_paystack_subaccount error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
