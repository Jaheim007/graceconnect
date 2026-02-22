import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: claims } = await anonClient.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { organization_id } = await req.json();
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || typeof organization_id !== 'string' || !UUID_RE.test(organization_id)) {
      return new Response(JSON.stringify({ error: 'Invalid organization_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify user is a member of this organization
    const { data: membership } = await db.from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organization_id)
      .maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: 'You are not a member of this organization' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Payout freeze check ──
    const { data: org } = await db.from('organizations').select('payouts_frozen, payout_freeze_reason, currency').eq('id', organization_id).single();
    if (org?.payouts_frozen) {
      return new Response(JSON.stringify({ error: `Payouts are currently frozen for this organization: ${org.payout_freeze_reason || 'Contact support'}` }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Find payable affiliate sales for this user in this org
    const now = new Date().toISOString();
    const { data: payableSales, error } = await db.from('affiliate_sales')
      .select('id, commission_amount, currency')
      .eq('affiliate_user_id', userId)
      .eq('organization_id', organization_id)
      .eq('status', 'pending')
      .lte('payable_at', now);

    if (error) throw error;
    if (!payableSales?.length) {
      return new Response(JSON.stringify({ ok: false, message: 'No payable commissions available yet. Commissions become payable 72h after the transaction.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate total payable
    const totalAmount = payableSales.reduce((sum: number, s: { commission_amount: number }) => sum + s.commission_amount, 0);
    const currency = org?.currency || 'XOF';

    // Mark sales as payable
    const saleIds = payableSales.map((s: { id: string }) => s.id);
    await db.from('affiliate_sales').update({ status: 'payable' }).in('id', saleIds);

    // Create payout request
    const { data: payoutReq } = await db.from('payout_requests').insert({
      organization_id,
      user_id: userId,
      payout_type: 'affiliate',
      amount: totalAmount,
      currency,
      status: 'requested',
      metadata: { sale_ids: saleIds },
    }).select('id').single();

    return new Response(JSON.stringify({
      ok: true,
      payout_request_id: payoutReq?.id,
      amount: totalAmount,
      currency,
      sales_count: payableSales.length,
      message: `Payout of ${totalAmount.toLocaleString('fr-FR')} ${currency} requested. A platform admin will process it shortly.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('request_affiliate_payout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
