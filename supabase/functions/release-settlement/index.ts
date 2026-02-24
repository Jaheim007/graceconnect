import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail, sendEmailToOrgAdmins } from '../_shared/send-email-helper.ts';

/**
 * release-settlement: Release held funds for vendor payouts after 72h hold period.
 * 
 * Can be called:
 * 1. By superadmin manually for a specific org
 * 2. By a cron job to auto-release eligible settlements
 * 
 * Flow:
 * - Find completed transactions older than 72h with settlement_status = 'held'
 * - Verify no active disputes or freezes
 * - Update Paystack subaccount settlement_schedule to 'auto' temporarily to release
 * - Or initiate a transfer via Transfer API
 * - Mark transactions as 'released'
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiter
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
    // Auth check — superadmin or cron (via anon key with special header)
    const authHeader = req.headers.get('Authorization');
    let isSuperadmin = false;
    let isCron = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      // Check if it's a user token
      const { data: { user } } = await db.auth.getUser(token);
      if (user) {
        const { data: roleRow } = await db.from('user_platform_roles').select('role').eq('user_id', user.id).maybeSingle();
        isSuperadmin = roleRow?.role === 'superadmin';
      } else {
        // Might be anon key for cron
        isCron = true;
      }
    }

    if (!isSuperadmin && !isCron) {
      return new Response(JSON.stringify({ error: 'Unauthorized: superadmin or cron only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let body: { organization_id?: string } = {};
    try { body = await req.json(); } catch { /* empty body for cron */ }

    const holdCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const results: Array<{ type: string; id: string; org_id: string; amount: number; status: string }> = [];

    // Find eligible donations
    let donationQuery = db.from('donations')
      .select('id, organization_id, organization_amount, currency, completed_at')
      .eq('status', 'completed')
      .eq('settlement_status', 'held')
      .lte('completed_at', holdCutoff)
      .is('dispute_status', null);

    if (body.organization_id) {
      donationQuery = donationQuery.eq('organization_id', body.organization_id);
    }

    const { data: eligibleDonations } = await donationQuery.limit(100);

    // Find eligible purchases
    let purchaseQuery = db.from('product_purchases')
      .select('id, organization_id, organization_amount, currency, completed_at')
      .eq('status', 'completed')
      .eq('settlement_status', 'held')
      .lte('completed_at', holdCutoff)
      .is('dispute_status', null);

    if (body.organization_id) {
      purchaseQuery = purchaseQuery.eq('organization_id', body.organization_id);
    }

    const { data: eligiblePurchases } = await purchaseQuery.limit(100);

    const allEligible = [
      ...(eligibleDonations || []).map(d => ({ ...d, type: 'donation' as const })),
      ...(eligiblePurchases || []).map(p => ({ ...p, type: 'product' as const })),
    ];

    if (!allEligible.length) {
      return new Response(JSON.stringify({ ok: true, message: 'No eligible settlements to release', released: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Group by organization
    const byOrg = new Map<string, typeof allEligible>();
    for (const tx of allEligible) {
      const list = byOrg.get(tx.organization_id) || [];
      list.push(tx);
      byOrg.set(tx.organization_id, list);
    }

    for (const [orgId, txs] of byOrg) {
      // Check org freeze
      const { data: org } = await db.from('organizations')
        .select('payouts_frozen, paystack_subaccount_code, name, is_active')
        .eq('id', orgId)
        .single();

      if (!org || org.payouts_frozen || !org.is_active) {
        // Mark as frozen instead
        const txIds = txs.map(t => t.id);
        for (const tx of txs) {
          const table = tx.type === 'donation' ? 'donations' : 'product_purchases';
          await db.from(table).update({ settlement_status: 'frozen' }).eq('id', tx.id);
          results.push({ type: tx.type, id: tx.id, org_id: orgId, amount: tx.organization_amount, status: 'frozen' });
        }
        continue;
      }

      // Release settlement: For manual settlement subaccounts, we trigger a settlement
      // by temporarily switching to auto then back, OR just mark as released
      // and let the process-payout handle actual transfers
      const now = new Date().toISOString();
      for (const tx of txs) {
        const table = tx.type === 'donation' ? 'donations' : 'product_purchases';
        await db.from(table).update({
          settlement_status: 'released',
          settlement_released_at: now,
        }).eq('id', tx.id);
        results.push({ type: tx.type, id: tx.id, org_id: orgId, amount: tx.organization_amount, status: 'released' });
      }

      // Audit log
      const totalReleased = txs.reduce((s, t) => s + (t.organization_amount || 0), 0);
      await db.from('audit_logs').insert({
        organization_id: orgId,
        action: 'settlement_released',
        resource_type: 'settlement',
        metadata: {
          transaction_count: txs.length,
          total_amount: totalReleased,
          currency: txs[0]?.currency || 'XOF',
        },
      });

      // Notify org admins
      sendEmailToOrgAdmins('payout_approved', orgId, {
        amount: totalReleased,
        currency: txs[0]?.currency || 'XOF',
        org_name: org.name || '',
        transaction_count: txs.length,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      ok: true,
      released: results.filter(r => r.status === 'released').length,
      frozen: results.filter(r => r.status === 'frozen').length,
      details: results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('release-settlement error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
