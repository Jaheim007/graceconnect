import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';

/**
 * moneroo-webhook: Receives webhook notifications from Moneroo.
 * Verifies HMAC-SHA256 signature, then processes the transaction.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-moneroo-signature',
};

async function computeHmacSha256(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const MONEROO_SECRET = Deno.env.get('MONEROO_SECRET_KEY');
  const WEBHOOK_SECRET = Deno.env.get('MONEROO_WEBHOOK_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const rawBody = await req.text();
    
    // Verify webhook signature
    if (WEBHOOK_SECRET) {
      const receivedSignature = req.headers.get('x-moneroo-signature') || '';
      const computedSignature = await computeHmacSha256(WEBHOOK_SECRET, rawBody);
      
      if (receivedSignature !== computedSignature) {
        console.error('[moneroo-webhook] Invalid signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    console.log(`[moneroo-webhook] Event: ${event}, ID: ${data?.id}, Status: ${data?.status}`);

    // Idempotency: check if we already processed this event
    const eventId = `moneroo_wh_${data?.id}_${event}`;
    const { data: existingEvent } = await db.from('payment_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log('[moneroo-webhook] Already processed, skipping');
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the event
    await db.from('payment_events').insert({
      event_id: eventId,
      event_type: event,
      gateway: 'moneroo',
      reference: data?.id || 'unknown',
      payload: data,
    }).catch((err: unknown) => console.warn('[moneroo-webhook] Event log error:', err));

    // Only process successful payments
    if (event === 'payment.success' && data?.status === 'success') {
      // Fetch full transaction details from Moneroo to get metadata
      if (!MONEROO_SECRET) {
        console.error('[moneroo-webhook] MONEROO_SECRET_KEY not set, cannot verify');
        return new Response(JSON.stringify({ error: 'Server config error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const verifyRes = await fetch(`https://api.moneroo.io/v1/payments/${data.id}/verify`, {
        headers: {
          'Authorization': `Bearer ${MONEROO_SECRET}`,
          'Accept': 'application/json',
        },
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || verifyData?.data?.status !== 'success') {
        console.error('[moneroo-webhook] Verification failed:', verifyData);
        return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const txData = verifyData.data;
      const metadata = txData.metadata || {};

      // Resolve from metadata (set during checkout init)
      const reference = metadata.reference || `SV-MNR-${txData.id}`;
      const txType = metadata.type;
      const orgId = metadata.organization_id;

      if (!txType || !orgId) {
        console.error('[moneroo-webhook] Missing type or organization_id in metadata');
        return new Response(JSON.stringify({ error: 'Missing metadata' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await processTransaction(db, {
        reference,
        type: txType,
        organization_id: orgId,
        gateway: 'moneroo',
        source: 'webhook',
        amount_paid: txData.amount,
        currency: txData.currency || 'XOF',
        campaign_id: metadata.campaign_id || null,
        product_id: metadata.product_id || null,
        user_id: metadata.user_id || null,
        donor_name: metadata.buyer_name || txData.customer?.firstName + ' ' + txData.customer?.lastName,
        donor_email: metadata.buyer_email || txData.customer?.email,
        affiliate_code: metadata.affiliate_code || null,
        promo_code: metadata.promo_code || null,
      });

      console.log('[moneroo-webhook] Transaction processed:', result.transaction_id);

      // Fire org webhook if configured
      try {
        const { data: org } = await db.from('organizations')
          .select('webhook_url, webhook_events')
          .eq('id', orgId)
          .maybeSingle();

        if (org?.webhook_url) {
          const webhookEvent = txType === 'donation' ? 'donation' : 'sale';
          const allowedEvents: string[] = org.webhook_events || [];
          if (allowedEvents.length === 0 || allowedEvents.includes(webhookEvent)) {
            fetch(org.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: webhookEvent,
                timestamp: new Date().toISOString(),
                organization_id: orgId,
                data: { ...result, gateway: 'moneroo' },
              }),
            }).catch(() => {});
          }
        }
      } catch (_e) { /* non-fatal */ }

      return new Response(JSON.stringify({ ok: true, ...result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other events (payment.failed, payment.cancelled, payout.*) — just acknowledge
    return new Response(JSON.stringify({ ok: true, event }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    if (err instanceof TransactionError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('[moneroo-webhook] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
