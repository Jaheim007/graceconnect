import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';

/**
 * stripe-verify: Called by frontend after Stripe redirects back.
 * Checks DB for already-processed transaction, then verifies with Stripe API.
 * Delegates transaction recording to shared processTransaction().
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const zeroDecimalCurrencies = ['XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json();
    let reference = body.reference;
    const session_id = body.session_id;

    // ── If no reference but we have session_id, resolve reference from Stripe ──
    if (!reference && session_id) {
      const meta = await resolveStripeMetadata(session_id, STRIPE_SECRET);
      if (meta?.sv_reference) {
        reference = meta.sv_reference;
        console.log('[stripe-verify] Resolved reference from session_id:', reference);
      }
    }

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference', hint: 'No reference could be resolved from URL or Stripe session' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Check if already in DB (webhook already processed) ──
    const existingResult = await checkDatabase(db, reference);
    if (existingResult) {
      existingResult.reference = reference;
      return new Response(JSON.stringify(existingResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Verify with Stripe API ──
    if (!session_id) {
      return new Response(JSON.stringify({
        ok: false, pending: true, reference,
        message: 'Transaction is being processed. Please wait a moment.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
    });

    if (!sessionRes.ok) {
      return new Response(JSON.stringify({
        ok: false, pending: true, reference,
        message: 'Unable to verify with Stripe. Please wait.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const session = await sessionRes.json();

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({
        ok: false, pending: true, reference,
        message: 'Payment not yet confirmed by Stripe.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get metadata (prefer payment_intent metadata)
    const meta = await resolveStripeMetadata(session_id, STRIPE_SECRET) || session.metadata || {};

    // Validate metadata matches our reference
    if (meta.sv_reference && meta.sv_reference !== reference) {
      reference = meta.sv_reference;
    }

    const type = meta.type as 'donation' | 'product';
    const organizationId = meta.organization_id;
    if (!type || !organizationId) {
      return new Response(JSON.stringify({ error: 'Missing metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Double-check DB again (race condition with webhook)
    const recheck = await checkDatabase(db, reference);
    if (recheck) {
      recheck.reference = reference;
      return new Response(JSON.stringify(recheck), {
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
      source: 'verify',
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    if (err instanceof TransactionError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('[stripe-verify] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── Helpers ───

async function resolveStripeMetadata(sessionId: string, stripeSecret: string): Promise<Record<string, string> | null> {
  try {
    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${stripeSecret}` },
    });
    if (!sessionRes.ok) return null;
    const session = await sessionRes.json();
    let meta = session.metadata || {};

    if (session.payment_intent && typeof session.payment_intent === 'string') {
      try {
        const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${session.payment_intent}`, {
          headers: { 'Authorization': `Bearer ${stripeSecret}` },
        });
        const pi = await piRes.json();
        if (pi.metadata?.sv_reference) meta = pi.metadata;
      } catch { /* use session metadata */ }
    }

    return meta;
  } catch { return null; }
}

async function checkDatabase(db: ReturnType<typeof createClient>, reference: string) {
  const { data: purchase } = await db.from('product_purchases')
    .select('id, amount, currency, status, platform_fee, affiliate_commission, organization_amount')
    .eq('paystack_reference', reference)
    .eq('status', 'completed')
    .maybeSingle();

  if (purchase) {
    return {
      ok: true, transaction_id: purchase.id, reference,
      breakdown: {
        amount: purchase.amount, currency: purchase.currency,
        platform_fee: purchase.platform_fee, affiliate_commission: purchase.affiliate_commission,
        organization_amount: purchase.organization_amount,
        affiliate_attributed: (purchase.affiliate_commission || 0) > 0,
        discount_amount: 0, promo_applied: false, partner_commission_included: false,
      },
    };
  }

  const { data: donation } = await db.from('donations')
    .select('id, amount, currency, status, platform_fee, affiliate_commission, organization_amount')
    .eq('paystack_reference', reference)
    .eq('status', 'completed')
    .maybeSingle();

  if (donation) {
    return {
      ok: true, transaction_id: donation.id, reference,
      breakdown: {
        amount: donation.amount, currency: donation.currency,
        platform_fee: donation.platform_fee, affiliate_commission: donation.affiliate_commission,
        organization_amount: donation.organization_amount,
        affiliate_attributed: (donation.affiliate_commission || 0) > 0,
        discount_amount: 0, promo_applied: false, partner_commission_included: false,
      },
    };
  }

  return null;
}
