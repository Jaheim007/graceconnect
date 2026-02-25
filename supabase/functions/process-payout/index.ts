import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

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
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Only superadmin
    const { data: roleRow } = await db.from('user_platform_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (roleRow?.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Superadmin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { payout_request_id, action } = await req.json();

    // Input validation
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!payout_request_id || typeof payout_request_id !== 'string' || !UUID_RE.test(payout_request_id)) {
      return new Response(JSON.stringify({ error: 'Invalid payout_request_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!action || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action, must be approve or reject' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
      // Send rejection email
      const rejEmail = await getUserEmail(payout.user_id);
      const { data: rejOrg } = await db.from('organizations').select('name').eq('id', payout.organization_id).maybeSingle();
      if (rejEmail) {
        sendEmail({ template: 'payout_rejected', to: rejEmail, data: { org_name: rejOrg?.name || '', reason: 'Request rejected by admin.' }, organization_id: payout.organization_id }).catch(() => {});
      }

      // Audit log
      await db.from('audit_logs').insert({
        user_id: user.id,
        organization_id: payout.organization_id,
        action: 'payout_rejected',
        resource_type: 'payout_request',
        resource_id: payout_request_id,
        metadata: { amount: payout.amount, currency: payout.currency, payout_type: payout.payout_type },
      });

      return new Response(JSON.stringify({ ok: true, status: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── action === 'approve' ──

    // For AFFILIATE payouts: commission is held by Siteviral (via transaction_charge).
    // We pay affiliates from Siteviral's main Paystack balance via Transfer API.
    if (payout.payout_type === 'affiliate') {
      // Verify all referenced sales have payable_at in the past (15-day hold)
      const saleIds = payout.metadata?.sale_ids || [];
      if (saleIds.length) {
        const now = new Date().toISOString();
        const { data: immatureSales } = await db.from('affiliate_sales')
          .select('id, payable_at')
          .in('id', saleIds)
          .gt('payable_at', now);
        if (immatureSales?.length) {
          return new Response(JSON.stringify({
            error: `${immatureSales.length} commission(s) not yet payable. Earliest payable at: ${immatureSales[0].payable_at}`,
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // ── Balance check: verify Paystack main balance before affiliate payout ──
      try {
        const balanceRes = await fetch('https://api.paystack.co/balance', {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });
        const balanceData = await balanceRes.json();
        if (balanceData.status && balanceData.data?.length) {
          const mainBalance = balanceData.data[0]; // First balance entry
          const availableBalance = (mainBalance.balance || 0) / 100; // Convert from kobo
          if (availableBalance < payout.amount) {
            // Log critical alert
            await db.from('platform_alerts').insert({
              alert_type: 'insufficient_balance',
              severity: 'critical',
              title: `Insufficient platform balance for affiliate payout`,
              details: { requested: payout.amount, available: availableBalance, currency: mainBalance.currency, payout_request_id },
            });
            return new Response(JSON.stringify({
              error: `Insufficient platform balance. Available: ${availableBalance.toLocaleString('fr-FR')} ${mainBalance.currency}. Requested: ${payout.amount.toLocaleString('fr-FR')} ${payout.currency}.`,
            }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      } catch (balErr) {
        console.error('Balance check failed (non-blocking for now):', balErr);
        // Log warning but don't block — balance API might be temporarily unavailable
        await db.from('platform_alerts').insert({
          alert_type: 'balance_check_failed',
          severity: 'warning',
          title: 'Failed to verify platform balance before payout',
          details: { error: String(balErr), payout_request_id },
        });
      }

      // Look up recipient code from payout_profiles (isolated table)
      const { data: recipientProfile } = await db.from('payout_profiles')
        .select('paystack_recipient_code')
        .eq('user_id', payout.user_id)
        .maybeSingle();

      let transferResult: Record<string, unknown> = {};
      if (recipientProfile?.paystack_recipient_code) {
        const psRes = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'balance', // From Siteviral's main balance
            amount: Math.round(payout.amount * 100),
            recipient: recipientProfile.paystack_recipient_code,
            reason: `Siteviral affiliate payout — request ${payout_request_id}`,
          }),
        });
        transferResult = await psRes.json();

        if (!(transferResult as any).status) {
          // Transfer failed — don't mark as paid
          await db.from('audit_logs').insert({
            user_id: user.id,
            organization_id: payout.organization_id,
            action: 'payout_transfer_failed',
            resource_type: 'payout_request',
            resource_id: payout_request_id,
            metadata: { error: (transferResult as any).message, amount: payout.amount },
          });
          return new Response(JSON.stringify({
            error: 'Paystack transfer failed',
            detail: (transferResult as any).message,
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Mark paid
      await db.from('payout_requests').update({
        status: recipientProfile?.paystack_recipient_code ? 'paid' : 'approved',
        processed_at: new Date().toISOString(),
        metadata: { ...payout.metadata, transfer_result: transferResult },
      }).eq('id', payout_request_id);

      if (saleIds.length) {
        await db.from('affiliate_sales').update({ status: 'paid', paid_at: new Date().toISOString() }).in('id', saleIds);
      }

      // Lock recipient after successful payout to prevent fraud
      if (recipientProfile?.paystack_recipient_code) {
        await db.from('payout_profiles').update({ recipient_locked: true }).eq('user_id', payout.user_id);
      }
    }

    // For ORG payouts: vendor funds sit in the org's Paystack subaccount.
    // We release by switching settlement_schedule from 'manual' to 'auto'.
    if (payout.payout_type === 'org' && payout.organization_id) {
      // Verify settlement_status = 'released' for enough funds
      const { data: releasedDonations } = await db.from('donations')
        .select('organization_amount')
        .eq('organization_id', payout.organization_id)
        .eq('status', 'completed')
        .eq('settlement_status', 'released');

      const { data: releasedPurchases } = await db.from('product_purchases')
        .select('organization_amount')
        .eq('organization_id', payout.organization_id)
        .eq('status', 'completed')
        .eq('settlement_status', 'released');

      const { data: otherPayouts } = await db.from('payout_requests')
        .select('amount, status')
        .eq('organization_id', payout.organization_id)
        .in('status', ['completed', 'paid', 'approved', 'processing'])
        .neq('id', payout.id);

      const releasedFunds = [...(releasedDonations || []), ...(releasedPurchases || [])]
        .reduce((s: number, t: any) => s + (t.organization_amount || 0), 0);
      const alreadyPaidOut = (otherPayouts || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const availableBalance = releasedFunds - alreadyPaidOut;

      if (payout.amount > availableBalance) {
        return new Response(JSON.stringify({
          error: `Insufficient released funds. Available: ${Math.max(0, availableBalance).toLocaleString('fr-FR')} ${payout.currency || 'XOF'}. Requested: ${payout.amount.toLocaleString('fr-FR')} ${payout.currency || 'XOF'}.`,
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Trigger settlement by temporarily switching subaccount to 'auto'
      const { data: org } = await db.from('organizations')
        .select('paystack_subaccount_code')
        .eq('id', payout.organization_id)
        .single();

      let transferResult: Record<string, unknown> = {};
      if (org?.paystack_subaccount_code) {
        // Update subaccount to auto settlement to release funds
        const psRes = await fetch(`https://api.paystack.co/subaccount/${org.paystack_subaccount_code}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ settlement_schedule: 'auto' }),
        });
        const psData = await psRes.json();
        transferResult = psData;

        // Immediately revert back to manual (must be synchronous — setTimeout won't fire after response)
        try {
          await fetch(`https://api.paystack.co/subaccount/${org.paystack_subaccount_code}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ settlement_schedule: 'manual' }),
          });
        } catch (e) {
          console.error('Failed to revert settlement_schedule to manual:', e);
          // Non-fatal: Paystack will still process the settlement
        }
      }

      // Mark paid
      await db.from('payout_requests').update({
        status: 'paid',
        processed_at: new Date().toISOString(),
        metadata: { ...payout.metadata, transfer_result: transferResult, settlement_release: true },
      }).eq('id', payout_request_id);
    }

    // Notify user
    await db.from('user_notifications').insert({
      user_id: payout.user_id,
      organization_id: payout.organization_id,
      title: '💸 Payout Processed',
      body: `Your ${payout.payout_type} payout of ${payout.amount.toLocaleString('fr-FR')} ${payout.currency} has been approved and is being transferred.`,
      notification_type: 'payout',
    });

    // Send approval email
    const { data: payOrg } = await db.from('organizations').select('name').eq('id', payout.organization_id).maybeSingle();
    const payEmail = await getUserEmail(payout.user_id);
    if (payEmail) {
      const template = payout.payout_type === 'affiliate' ? 'affiliate_payout_completed' : 'payout_approved';
      sendEmail({ template, to: payEmail, data: { amount: payout.amount, currency: payout.currency, org_name: payOrg?.name || '' }, organization_id: payout.organization_id }).catch(() => {});
    }

    // Audit log
    await db.from('audit_logs').insert({
      user_id: user.id,
      organization_id: payout.organization_id,
      action: 'payout_approved',
      resource_type: 'payout_request',
      resource_id: payout_request_id,
      metadata: { amount: payout.amount, currency: payout.currency, payout_type: payout.payout_type },
    });

    return new Response(JSON.stringify({ ok: true, status: 'paid', payout_type: payout.payout_type }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('process_payout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
