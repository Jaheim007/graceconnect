import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';
import { rateLimit } from '../_shared/rate-limit.ts';

/**
 * request-partner-payout
 * Aggregates payable partner commissions and creates a payout request.
 * JWT required (partner must be logged in).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  const rl = await rateLimit(clientIp, 3);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { partner_id } = body;

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!partner_id || !UUID_RE.test(partner_id)) {
      return new Response(JSON.stringify({ error: 'Invalid partner_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify ownership
    const { data: partner } = await db.from('partners').select('*').eq('id', partner_id).single();
    if (!partner || partner.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (partner.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Partner not approved' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!partner.paystack_recipient_code) {
      return new Response(JSON.stringify({ error: 'Configurez d\'abord vos informations de paiement' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check no pending payout already
    const { data: pendingPayout } = await db.from('partner_payout_requests')
      .select('id')
      .eq('partner_id', partner_id)
      .in('status', ['requested', 'processing'])
      .limit(1)
      .maybeSingle();
    if (pendingPayout) {
      return new Response(JSON.stringify({ error: 'Vous avez déjà une demande de paiement en cours' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get payable commissions (held → payable transition based on payable_at)
    const now = new Date().toISOString();

    // First, transition any matured held commissions to payable
    await db.from('partner_commissions')
      .update({ status: 'payable' })
      .eq('partner_id', partner_id)
      .eq('status', 'held')
      .lte('payable_at', now);

    // Now fetch all payable
    const { data: payableCommissions, error: commErr } = await db.from('partner_commissions')
      .select('id, commission_amount, currency')
      .eq('partner_id', partner_id)
      .eq('status', 'payable');

    if (commErr) throw commErr;
    if (!payableCommissions?.length) {
      return new Response(JSON.stringify({ ok: false, message: 'Aucune commission disponible. Les commissions deviennent disponibles 15 jours après la transaction.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalAmount = payableCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
    const currency = payableCommissions[0].currency || 'XOF';

    // Check minimum threshold
    if (totalAmount < partner.min_payout_threshold) {
      return new Response(JSON.stringify({
        ok: false,
        message: `Le seuil minimum de ${partner.min_payout_threshold.toLocaleString('fr-FR')} ${currency} n'est pas atteint. Solde actuel : ${totalAmount.toLocaleString('fr-FR')} ${currency}.`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const commissionIds = payableCommissions.map(c => c.id);

    // Create payout request
    const { data: payoutReq } = await db.from('partner_payout_requests').insert({
      partner_id,
      amount: totalAmount,
      currency,
      status: 'requested',
      commission_ids: commissionIds,
    }).select('id').single();

    // Notify superadmins
    const { data: superadmins } = await db.from('user_platform_roles')
      .select('user_id')
      .eq('role', 'superadmin');
    if (superadmins?.length) {
      const notifications = superadmins.map(sa => ({
        user_id: sa.user_id,
        title: '💰 Demande paiement partenaire',
        body: `${partner.full_name} demande un versement de ${totalAmount.toLocaleString('fr-FR')} ${currency}.`,
        notification_type: 'payout',
      }));
      await db.from('user_notifications').insert(notifications);
    }

    // Audit
    await db.from('audit_logs').insert({
      user_id: user.id,
      action: 'partner.payout_requested',
      resource_type: 'partner_payout_request',
      resource_id: payoutReq?.id,
      metadata: { amount: totalAmount, currency, commissions_count: commissionIds.length },
    });

    return new Response(JSON.stringify({
      ok: true,
      payout_request_id: payoutReq?.id,
      amount: totalAmount,
      currency,
      commissions_count: commissionIds.length,
      message: `Demande de versement de ${totalAmount.toLocaleString('fr-FR')} ${currency} soumise. Un administrateur la traitera sous peu.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('request-partner-payout error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
