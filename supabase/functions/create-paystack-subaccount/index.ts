import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;
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

    const { organization_id, business_name, settlement_bank, account_number } = await req.json();

    if (!organization_id || !business_name || !settlement_bank || !account_number) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    const { data: org } = await db.from('organizations').select('monetization_enabled, kyc_status, paystack_subaccount_code').eq('id', organization_id).single();
    if (!org?.monetization_enabled) {
      return new Response(JSON.stringify({ error: 'KYC approval and monetization must be enabled first' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If subaccount already exists, fetch it
    if (org.paystack_subaccount_code) {
      return new Response(JSON.stringify({ ok: true, subaccount_code: org.paystack_subaccount_code, existing: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Paystack subaccount
    const psRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name,
        settlement_bank,
        account_number,
        percentage_charge: 0, // platform handles the split logic
      }),
    });
    const psData = await psRes.json();

    if (!psData.status) {
      return new Response(JSON.stringify({ error: 'Paystack subaccount creation failed', detail: psData.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subaccountCode = psData.data.subaccount_code;

    // Save to organization
    await db.from('organizations').update({ paystack_subaccount_code: subaccountCode }).eq('id', organization_id);

    return new Response(JSON.stringify({ ok: true, subaccount_code: subaccountCode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('create_paystack_subaccount error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
