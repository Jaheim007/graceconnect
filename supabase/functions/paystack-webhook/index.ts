import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';

/**
 * paystack-webhook: Receives Paystack webhook events.
 * Handles charge.success, disputes, transfers.
 * Delegates transaction recording to shared processTransaction().
 */

const requestCounts = new Map<string, { count: number; windowStart: number }>();
function checkRateLimit(ip: string | null, max = 60): boolean {
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  if (!checkRateLimit(clientIp, 60)) {
    return new Response('Rate limited', { status: 429 });
  }

  const PAYSTACK_SECRET = getPaystackSecretKey();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // ── 1. Validate Paystack signature ──
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      console.error('Missing x-paystack-signature header');
      return new Response('Unauthorized', { status: 401 });
    }
    const hash = createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
    if (hash !== signature) {
      console.error('Invalid Paystack signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const event = JSON.parse(body);
    const eventId = event.id || `${event.event}-${Date.now()}`;
    console.log('Paystack webhook event:', event.event, 'id:', eventId);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 2. Idempotency: upsert payment_events ──
    const { data: existingEvent } = await db.from('payment_events')
      .select('id, status')
      .eq('event_id', String(eventId))
      .maybeSingle();

    if (existingEvent?.status === 'processed') {
      console.log('Event already processed:', eventId);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txData = event.data;
    const reference = txData?.reference as string | undefined;

    // Log the event
    if (!existingEvent) {
      await db.from('payment_events').insert({
        event_id: String(eventId),
        provider: 'paystack',
        reference: reference || null,
        payload: event,
        status: 'received',
      });
    }

    // ── Handle dispute events ──
    if (event.event === 'charge.dispute.create' || event.event === 'charge.dispute.remind' || event.event === 'charge.dispute.resolve') {
      const disputeRef = txData?.transaction?.reference || txData?.reference;
      const disputeId = txData?.id || txData?.dispute_id;
      const disputeStatus = event.event === 'charge.dispute.resolve' ? 'resolved' : 'active';

      if (disputeRef) {
        await db.from('donations').update({
          dispute_status: disputeStatus, dispute_id: String(disputeId),
          settlement_status: disputeStatus === 'active' ? 'disputed' : 'held',
        }).eq('paystack_reference', disputeRef);

        await db.from('product_purchases').update({
          dispute_status: disputeStatus, dispute_id: String(disputeId),
          settlement_status: disputeStatus === 'active' ? 'disputed' : 'held',
        }).eq('paystack_reference', disputeRef);

        if (disputeStatus === 'active') {
          const { data: donation } = await db.from('donations').select('organization_id').eq('paystack_reference', disputeRef).maybeSingle();
          const { data: purchase } = await db.from('product_purchases').select('organization_id').eq('paystack_reference', disputeRef).maybeSingle();
          const orgId = donation?.organization_id || purchase?.organization_id;
          if (orgId) {
            await db.from('audit_logs').insert({
              organization_id: orgId, action: 'dispute_opened', resource_type: 'payment',
              metadata: { reference: disputeRef, dispute_id: disputeId, event: event.event },
            });
          }
        }
      }

      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, dispute_handled: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Handle transfer events ──
    if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const transferStatus = event.event === 'transfer.success' ? 'completed' : event.event === 'transfer.failed' ? 'failed' : 'reversed';
      await db.from('audit_logs').insert({
        action: `transfer_${transferStatus}`, resource_type: 'transfer',
        metadata: { transfer_code: txData?.transfer_code, recipient_code: txData?.recipient?.recipient_code, amount: txData?.amount, reason: txData?.reason || txData?.complete_message || '', event: event.event },
      });
      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, transfer_handled: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only process successful charges
    if (event.event !== 'charge.success') {
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!reference) {
      console.error('No reference in webhook data');
      return new Response(JSON.stringify({ error: 'No reference' }), { status: 400 });
    }

    // Only process our own references (SV- prefix)
    if (!reference.startsWith('SV-')) {
      console.log('Ignoring non-SV reference:', reference);
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Extract metadata ──
    const meta = txData.metadata || {};
    const type = (meta.type as string) || undefined;
    const organizationId = meta.organization_id as string | undefined;
    const productId = meta.product_id as string | undefined;
    const campaignId = meta.campaign_id as string | undefined;
    const userId = meta.user_id as string | undefined;
    const donorName = meta.donor_name as string | undefined;
    const donorEmail = (meta.donor_email as string | undefined) || txData.customer?.email;
    const affiliateCode = meta.affiliate_code as string | undefined;

    if (!organizationId) {
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, warning: 'no_metadata' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const amountPaid = txData.amount / 100;
    const currency = txData.currency || 'XOF';

    // ── Delegate to shared core ──
    const result = await processTransaction(db, {
      reference,
      type: (type === 'product' ? 'product' : 'donation') as 'donation' | 'product',
      organization_id: organizationId,
      gateway: 'paystack',
      source: 'webhook',
      amount_paid: amountPaid,
      currency,
      campaign_id: campaignId,
      product_id: productId,
      user_id: userId,
      donor_name: donorName,
      donor_email: donorEmail,
      affiliate_code: affiliateCode,
    });

    // Mark event processed
    await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));

    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('paystack-webhook error:', err);
    // Return 200 to prevent Paystack retries on non-transient errors
    return new Response(JSON.stringify({ error: String(err) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
