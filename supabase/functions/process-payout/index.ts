import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; windowStart: number }>();
function checkRateLimit(ip: string | null, max = 10): boolean {
  const key = ip || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now - entry.windowStart > 60000) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Rate limiting (strict for payouts)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  if (!checkRateLimit(clientIp, 10)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;
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

    // Only superadmin
    const { data: roleRow } = await db.from('user_platform_roles').select('role').eq('user_id', userId).maybeSingle();
    if (roleRow?.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Superadmin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { payout_request_id, action } = await req.json(); // action: 'approve' | 'reject'

    const { data: payout } = await db.from('payout_requests').select('*').eq('id', payout_request_id).single();
    if (!payout) return new Response(JSON.stringify({ error: 'Payout request not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (payout.status !== 'requested') return new Response(JSON.stringify({ error: 'Payout already processed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // ── Payout freeze check ──
    if (payout.organization_id) {
      const { data: org } = await db.from('organizations').select('payouts_frozen, payout_freeze_reason').eq('id', payout.organization_id).single();
      if (org?.payouts_frozen) {
        return new Response(JSON.stringify({ error: `Payouts frozen for this organization: ${org.payout_freeze_reason || 'Contact support'}` }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (action === 'reject') {
      await db.from('payout_requests').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', payout_request_id);
      // Revert affiliate_sales back to payable
      const saleIds = payout.metadata?.sale_ids || [];
      if (saleIds.length) await db.from('affiliate_sales').update({ status: 'payable' }).in('id', saleIds);
      return new Response(JSON.stringify({ ok: true, status: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // action === 'approve' — attempt Paystack transfer
    // Lookup affiliate user's recipient code from kyc_submissions
    const { data: kyc } = await db.from('kyc_submissions')
      .select('paystack_recipient_code')
      .eq('organization_id', payout.organization_id)
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let transferResult: Record<string, unknown> = {};
    if (kyc?.paystack_recipient_code) {
      // Amount: Paystack transfers in kobo/lowest denomination — XOF is zero-decimal, multiply by 100
      const psRes = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'balance',
          amount: Math.round(payout.amount * 100),
          recipient: kyc.paystack_recipient_code,
          reason: `Siteviral affiliate payout — request ${payout_request_id}`,
        }),
      });
      transferResult = await psRes.json();
    }

    // Mark paid regardless (manual if no recipient code)
    await db.from('payout_requests').update({ status: 'paid', processed_at: new Date().toISOString(), metadata: { ...payout.metadata, transfer_result: transferResult } }).eq('id', payout_request_id);

    const saleIds = payout.metadata?.sale_ids || [];
    if (saleIds.length) {
      await db.from('affiliate_sales').update({ status: 'paid', paid_at: new Date().toISOString() }).in('id', saleIds);
    }

    // Notify affiliate user
    await db.from('user_notifications').insert({
      user_id: payout.user_id,
      organization_id: payout.organization_id,
      title: '💸 Payout Processed',
      body: `Your affiliate payout of ${payout.amount.toLocaleString('fr-FR')} ${payout.currency} has been approved and is being transferred.`,
      notification_type: 'payout',
    });

    return new Response(JSON.stringify({ ok: true, status: 'paid', transfer: transferResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('process_payout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
