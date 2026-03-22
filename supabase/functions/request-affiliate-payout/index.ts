import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail, sendEmailToOrgAdmins } from '../_shared/send-email-helper.ts';
import { dispatchWebhook } from '../_shared/dispatch-webhook.ts';

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
    const { data: org } = await db.from('organizations').select('payouts_frozen, payout_freeze_reason, currency, name').eq('id', organization_id).single();
    if (org?.payouts_frozen) {
      return new Response(JSON.stringify({ error: `Payouts are currently frozen for this organization: ${org.payout_freeze_reason || 'Contact support'}` }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── KYC check: verify org-level KYC is approved before payout ──
    const { data: kycData } = await db.from('kyc_submissions')
      .select('status')
      .eq('organization_id', organization_id)
      .in('status', ['level1', 'level2', 'approved'])
      .limit(1);
    if (!kycData?.length) {
      return new Response(JSON.stringify({ error: 'KYC verification required before requesting a payout. Please complete KYC for this organization.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Prevent duplicate payout requests while a manual payout is still unresolved
    const { data: pendingPayout } = await db.from('payout_requests')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('user_id', userId)
      .eq('payout_type', 'affiliate')
      .in('status', ['pending', 'requested', 'approved', 'processing'])
      .limit(1)
      .maybeSingle();
    if (pendingPayout) {
      return new Response(JSON.stringify({ error: 'You already have an affiliate payout request in progress for this organization.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find payable affiliate sales for this user in this org
    // Sales start as 'pending' and become 'payable' after 15 days via release_matured_affiliate_sales()
    // We also include pending sales that have matured (payable_at <= now) in case the cron hasn't run yet
    const now = new Date().toISOString();

    // First, trigger maturation for this org's sales in case cron hasn't run
    await db.rpc('release_matured_affiliate_sales');

    const { data: payableSales, error } = await db.from('affiliate_sales')
      .select('id, commission_amount, currency')
      .eq('affiliate_user_id', userId)
      .eq('organization_id', organization_id)
      .eq('status', 'payable');

    if (error) throw error;
    if (!payableSales?.length) {
      return new Response(JSON.stringify({ ok: false, message: 'No payable commissions available yet. Commissions become payable 15 days after the transaction.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate total payable
    const totalAmount = payableSales.reduce((sum: number, s: { commission_amount: number }) => sum + s.commission_amount, 0);
    const currency = org?.currency || 'XOF';
    const saleIds = payableSales.map((s: { id: string }) => s.id);

    // Create payout request first so commissions are never lost if the insert fails
    const { data: payoutReq, error: payoutReqError } = await db.from('payout_requests').insert({
      organization_id,
      user_id: userId,
      payout_type: 'affiliate',
      amount: totalAmount,
      currency,
      status: 'pending',
      metadata: { sale_ids: saleIds },
    }).select('id').single();
    if (payoutReqError) throw payoutReqError;

    // Reserve the sales so they can't be requested twice while the manual payout is pending
    const { error: reserveSalesError } = await db.from('affiliate_sales')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .in('id', saleIds);
    if (reserveSalesError) {
      if (payoutReq?.id) {
        await db.from('payout_requests').delete().eq('id', payoutReq.id);
      }
      throw reserveSalesError;
    }

    // Send confirmation email to requester
    const reqEmail = await getUserEmail(userId);
    if (reqEmail) {
      sendEmail({ template: 'affiliate_payout_requested', to: reqEmail, data: { amount: totalAmount, currency, org_name: org?.name || '' }, organization_id: organization_id }).catch(() => {});
    }
    // Notify org admins
    sendEmailToOrgAdmins('payout_requested', organization_id, { amount: totalAmount, currency, org_name: org?.name || '' }).catch(() => {});

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
