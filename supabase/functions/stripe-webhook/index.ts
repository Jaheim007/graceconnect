import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';

/**
 * Stripe Webhook handler.
 * Processes checkout.session.completed events.
 * Delegates transaction recording to shared processTransaction().
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    const elements = sigHeader.split(',').map((e) => e.trim());
    const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
    const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.slice(3));
    if (!timestamp || signatures.length === 0) return false;
    const ts = parseInt(timestamp);
    if (Math.abs(Date.now() / 1000 - ts) > 300) return false;
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret.trim()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return signatures.some(s => s === expectedSig);
  } catch { return false; }
}

async function fetchStripeEvent(eventId: string, stripeSecret: string) {
  try {
    const res = await fetch(`https://api.stripe.com/v1/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${stripeSecret}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

const zeroDecimalCurrencies = ['XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!;
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const rawBody = await req.text();
    const sigHeader = req.headers.get('stripe-signature') || '';

    let event: any;

    if (STRIPE_WEBHOOK_SECRET) {
      const valid = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        console.error('[stripe-webhook] Invalid signature, trying Stripe API fallback');
        const parsed = JSON.parse(rawBody);
        const eventId = parsed?.id;
        if (!eventId) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const remoteEvent = await fetchStripeEvent(eventId, STRIPE_SECRET);
        if (!remoteEvent) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        event = remoteEvent;
      } else {
        event = JSON.parse(rawBody);
      }
    } else {
      event = JSON.parse(rawBody);
    }

    // Only handle checkout.session.completed
    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true, skipped: event.type }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = event.data.object;

    // Get PaymentIntent metadata (more reliable)
    let meta = session.metadata || {};
    if (session.payment_intent && typeof session.payment_intent === 'string') {
      try {
        const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${session.payment_intent}`, {
          headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
        });
        const pi = await piRes.json();
        if (pi.metadata) meta = pi.metadata;
      } catch { /* use session metadata */ }
    }

    const reference = meta.sv_reference;
    const type = meta.type as 'donation' | 'product';
    const organizationId = meta.organization_id;

    if (!reference || !type || !organizationId) {
      console.error('[stripe-webhook] Missing metadata:', meta);
      return new Response(JSON.stringify({ error: 'Missing metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency check
    const table = type === 'donation' ? 'donations' : 'product_purchases';
    const { data: existing } = await db.from(table)
      .select('id, status')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (existing?.status === 'completed') {
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Amount conversion
    const currency = (session.currency || 'usd').toUpperCase();
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
    const amountPaid = isZeroDecimal ? session.amount_total : session.amount_total / 100;

    // ── Delegate to shared core ──
    const result = await processTransaction(db, {
      reference,
      type,
      organization_id: organizationId,
      gateway: 'stripe',
      source: 'webhook',
      amount_paid: amountPaid,
      currency,
      campaign_id: meta.campaign_id,
      product_id: meta.product_id,
      user_id: meta.user_id || null,
      donor_name: meta.buyer_name,
      donor_email: meta.buyer_email || session.customer_email,
      affiliate_code: meta.affiliate_code,
      promo_code: meta.promo_code,
    });

    console.log(`[stripe-webhook] ✅ ${type} processed: ${reference} — ${amountPaid} ${currency}`);

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    if (err instanceof TransactionError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('[stripe-webhook] error:', err);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
