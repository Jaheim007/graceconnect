import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';

/**
 * process-partner-payout
 * Superadmin approves or rejects a partner payout request.
 * On approve: checks balance → initiates Paystack Transfer → marks commissions paid.
 * On reject: reverts commissions back to payable.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const PAYSTACK_SECRET = getPaystackSecretKey();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth — superadmin only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: roleRow } = await db.from('user_platform_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (roleRow?.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Superadmin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { payout_request_id, action } = await req.json();

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!payout_request_id || !UUID_RE.test(payout_request_id)) {
      return new Response(JSON.stringify({ error: 'Invalid payout_request_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!action || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch payout request
    const { data: payout } = await db.from('partner_payout_requests').select('*').eq('id', payout_request_id).single();
    if (!payout) return new Response(JSON.stringify({ error: 'Payout request not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (payout.status !== 'requested') return new Response(JSON.stringify({ error: 'Payout already processed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Fetch partner
    const { data: partner } = await db.from('partners').select('id, full_name, user_id, paystack_recipient_code').eq('id', payout.partner_id).single();
    if (!partner) return new Response(JSON.stringify({ error: 'Partner not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const commissionIds: string[] = payout.commission_ids || [];

    // ── REJECT ──
    if (action === 'reject') {
      await db.from('partner_payout_requests').update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      }).eq('id', payout_request_id);

      // Revert commissions back to payable
      if (commissionIds.length) {
        await db.from('partner_commissions').update({ status: 'payable' }).in('id', commissionIds);
      }

      // Notify partner
      await db.from('user_notifications').insert({
        user_id: partner.user_id,
        title: '❌ Demande de paiement rejetée',
        body: `Votre demande de versement de ${payout.amount.toLocaleString('fr-FR')} ${payout.currency} a été rejetée.`,
        notification_type: 'payout',
      });

      // Audit
      await db.from('audit_logs').insert({
        user_id: user.id,
        action: 'partner.payout_rejected',
        resource_type: 'partner_payout_request',
        resource_id: payout_request_id,
        metadata: { amount: payout.amount, currency: payout.currency, partner_name: partner.full_name },
      });

      return new Response(JSON.stringify({ ok: true, status: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── APPROVE ──

    // 1. Verify recipient code
    if (!partner.paystack_recipient_code) {
      return new Response(JSON.stringify({ error: 'Le partenaire n\'a pas configuré ses informations de paiement' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Re-verify all commissions are still payable and not reversed
    if (commissionIds.length) {
      const { data: validCommissions } = await db.from('partner_commissions')
        .select('id')
        .in('id', commissionIds)
        .eq('status', 'payable');
      
      const validIds = new Set((validCommissions || []).map(c => c.id));
      const invalidIds = commissionIds.filter(id => !validIds.has(id));
      if (invalidIds.length) {
        return new Response(JSON.stringify({
          error: `${invalidIds.length} commission(s) ne sont plus disponibles (refund/dispute). Rejetez cette demande.`,
          invalid_ids: invalidIds,
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // 3. Platform balance check
    try {
      const balanceRes = await fetch('https://api.paystack.co/balance', {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const balanceData = await balanceRes.json();
      if (balanceData.status && balanceData.data?.length) {
        const mainBalance = balanceData.data[0];
        const availableBalance = (mainBalance.balance || 0) / 100;
        if (availableBalance < payout.amount) {
          await db.from('audit_logs').insert({
            user_id: user.id,
            action: 'partner.payout_insufficient_balance',
            resource_type: 'partner_payout_request',
            resource_id: payout_request_id,
            metadata: { requested: payout.amount, available: availableBalance },
          });
          return new Response(JSON.stringify({
            error: `Solde plateforme insuffisant. Disponible : ${availableBalance.toLocaleString('fr-FR')} ${mainBalance.currency}. Demandé : ${payout.amount.toLocaleString('fr-FR')} ${payout.currency}.`,
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    } catch (balErr) {
      console.error('Balance check failed:', balErr);
      // Non-blocking warning
    }

    // 4. Initiate Paystack Transfer
    await db.from('partner_payout_requests').update({ status: 'processing' }).eq('id', payout_request_id);

    const psRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(payout.amount * 100), // Convert to kobo/centimes
        recipient: partner.paystack_recipient_code,
        reason: `Siteviral Partner payout — ${partner.full_name} — req ${payout_request_id}`,
      }),
    });
    const psData = await psRes.json();

    if (!psData.status) {
      // Transfer failed
      await db.from('partner_payout_requests').update({ status: 'failed', processed_at: new Date().toISOString(), processed_by: user.id }).eq('id', payout_request_id);
      
      await db.from('audit_logs').insert({
        user_id: user.id,
        action: 'partner.payout_transfer_failed',
        resource_type: 'partner_payout_request',
        resource_id: payout_request_id,
        metadata: { error: psData.message, amount: payout.amount },
      });

      return new Response(JSON.stringify({ error: 'Échec du transfert Paystack', detail: psData.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Mark payout as paid
    await db.from('partner_payout_requests').update({
      status: 'paid',
      processed_at: new Date().toISOString(),
      processed_by: user.id,
      paystack_transfer_code: psData.data?.transfer_code || null,
      paystack_reference: psData.data?.reference || null,
    }).eq('id', payout_request_id);

    // 6. Mark commissions as paid
    if (commissionIds.length) {
      await db.from('partner_commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).in('id', commissionIds);
    }

    // 7. Notify partner
    await db.from('user_notifications').insert({
      user_id: partner.user_id,
      title: '💸 Versement partenaire effectué',
      body: `Votre versement de ${payout.amount.toLocaleString('fr-FR')} ${payout.currency} a été envoyé.`,
      notification_type: 'payout',
    });

    // 8. Email partner
    const partnerEmail = await getUserEmail(partner.user_id);
    if (partnerEmail) {
      sendEmail({
        template: 'affiliate_payout_completed',
        to: partnerEmail,
        data: { amount: payout.amount, currency: payout.currency, partner_name: partner.full_name },
      }).catch(() => {});
    }

    // 9. Audit
    await db.from('audit_logs').insert({
      user_id: user.id,
      action: 'partner.payout_approved',
      resource_type: 'partner_payout_request',
      resource_id: payout_request_id,
      metadata: {
        amount: payout.amount,
        currency: payout.currency,
        partner_name: partner.full_name,
        transfer_code: psData.data?.transfer_code,
        commissions_count: commissionIds.length,
      },
    });

    return new Response(JSON.stringify({
      ok: true,
      status: 'paid',
      transfer_code: psData.data?.transfer_code,
      amount: payout.amount,
      currency: payout.currency,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('process-partner-payout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
