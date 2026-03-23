import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


/**
 * release-settlement: Release held funds for vendor payouts after 72h hold period.
 * 
 * Supports cursor-based pagination to handle 10k+ orgs without timeouts.
 * Processes up to BATCH_SIZE transactions per invocation.
 * Returns a cursor for the next batch if more remain.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 200; // Process max 200 transactions per invocation

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth check — superadmin or cron
    const authHeader = req.headers.get('Authorization');
    let isSuperadmin = false;
    let isCron = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await db.auth.getUser(token);
      if (user) {
        const { data: roleRow } = await db.from('user_platform_roles').select('role').eq('user_id', user.id).maybeSingle();
        isSuperadmin = roleRow?.role === 'superadmin';
      } else {
        isCron = true;
      }
    }

    if (!isSuperadmin && !isCron) {
      return new Response(JSON.stringify({ error: 'Unauthorized: superadmin or cron only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let body: { organization_id?: string; cursor?: string } = {};
    try { body = await req.json(); } catch { /* empty body for cron */ }

    const holdCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const results: Array<{ type: string; id: string; org_id: string; amount: number; status: string }> = [];
    const halfBatch = Math.floor(BATCH_SIZE / 2);

    // Fetch eligible donations with cursor-based pagination
    let donationQuery = db.from('donations')
      .select('id, organization_id, organization_amount, currency, completed_at')
      .eq('status', 'completed')
      .eq('settlement_status', 'held')
      .lte('completed_at', holdCutoff)
      .is('dispute_status', null)
      .order('completed_at', { ascending: true })
      .limit(halfBatch);

    if (body.organization_id) donationQuery = donationQuery.eq('organization_id', body.organization_id);
    if (body.cursor) donationQuery = donationQuery.gt('completed_at', body.cursor);

    const { data: eligibleDonations } = await donationQuery;

    // Fetch eligible purchases with same cursor
    let purchaseQuery = db.from('product_purchases')
      .select('id, organization_id, organization_amount, currency, completed_at')
      .eq('status', 'completed')
      .eq('settlement_status', 'held')
      .lte('completed_at', holdCutoff)
      .is('dispute_status', null)
      .order('completed_at', { ascending: true })
      .limit(halfBatch);

    if (body.organization_id) purchaseQuery = purchaseQuery.eq('organization_id', body.organization_id);
    if (body.cursor) purchaseQuery = purchaseQuery.gt('completed_at', body.cursor);

    const { data: eligiblePurchases } = await purchaseQuery;

    const allEligible = [
      ...(eligibleDonations || []).map(d => ({ ...d, type: 'donation' as const })),
      ...(eligiblePurchases || []).map(p => ({ ...p, type: 'product' as const })),
    ].sort((a, b) => (a.completed_at || '').localeCompare(b.completed_at || ''));

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

    // Cache org lookups to avoid repeated queries
    const orgCache = new Map<string, { payouts_frozen: boolean; name: string; is_active: boolean } | null>();

    for (const [orgId, txs] of byOrg) {
      let org = orgCache.get(orgId);
      if (org === undefined) {
        const { data } = await db.from('organizations')
          .select('payouts_frozen, name, is_active')
          .eq('id', orgId)
          .single();
        org = data;
        orgCache.set(orgId, org);
      }

      if (!org || org.payouts_frozen || !org.is_active) {
        for (const tx of txs) {
          const table = tx.type === 'donation' ? 'donations' : 'product_purchases';
          await db.from(table).update({ settlement_status: 'frozen' }).eq('id', tx.id);
          results.push({ type: tx.type, id: tx.id, org_id: orgId, amount: tx.organization_amount, status: 'frozen' });
        }
        continue;
      }

      const now = new Date().toISOString();
      // Batch update per table per org for efficiency
      const donationIds = txs.filter(t => t.type === 'donation').map(t => t.id);
      const purchaseIds = txs.filter(t => t.type === 'product').map(t => t.id);

      if (donationIds.length) {
        await db.from('donations').update({ settlement_status: 'released', settlement_released_at: now }).in('id', donationIds);
      }
      if (purchaseIds.length) {
        await db.from('product_purchases').update({ settlement_status: 'released', settlement_released_at: now }).in('id', purchaseIds);
      }

      for (const tx of txs) {
        results.push({ type: tx.type, id: tx.id, org_id: orgId, amount: tx.organization_amount, status: 'released' });
      }

      // Single audit log per org batch
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

      // Settlement release is an automated internal process (72h hold expiry).
      // No email is sent here — emails are only sent when a user explicitly
      // requests a payout via request-payout or request-affiliate-payout.
    }

    // Compute next cursor for pagination
    const lastTx = allEligible[allEligible.length - 1];
    const hasMore = allEligible.length >= BATCH_SIZE;
    const nextCursor = hasMore ? lastTx.completed_at : null;

    return new Response(JSON.stringify({
      ok: true,
      released: results.filter(r => r.status === 'released').length,
      frozen: results.filter(r => r.status === 'frozen').length,
      processed: results.length,
      has_more: hasMore,
      next_cursor: nextCursor,
      details: results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('release-settlement error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
