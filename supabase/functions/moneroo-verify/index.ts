import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';

/**
 * moneroo-verify: Called by frontend after Moneroo redirect.
 * Verifies payment with Moneroo API, then processes via shared core.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const MONEROO_SECRET = Deno.env.get('MONEROO_SECRET_KEY');
  if (!MONEROO_SECRET) {
    return new Response(JSON.stringify({ error: 'Moneroo secret key not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json();
    const { payment_id, reference } = body;

    if (!payment_id && !reference) {
      return new Response(JSON.stringify({ error: 'payment_id or reference required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve authenticated user
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await db.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // If we have a reference but no payment_id, look up from payment_events
    let resolvedPaymentId = payment_id;
    if (!resolvedPaymentId && reference) {
      const { data: initEvent } = await db.from('payment_events')
        .select('payload')
        .eq('reference', reference)
        .eq('event_type', 'moneroo.payment.initialized')
        .maybeSingle();
      
      if (initEvent?.payload) {
        const eventPayload = initEvent.payload as Record<string, unknown>;
        resolvedPaymentId = eventPayload.moneroo_payment_id;
      }
    }

    if (!resolvedPaymentId) {
      return new Response(JSON.stringify({ error: 'Could not resolve Moneroo payment ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify with Moneroo API
    const verifyRes = await fetch(`https://api.moneroo.io/v1/payments/${resolvedPaymentId}/verify`, {
      headers: {
        'Authorization': `Bearer ${MONEROO_SECRET}`,
        'Accept': 'application/json',
      },
    });
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      return new Response(JSON.stringify({ error: 'Moneroo verification failed', details: verifyData }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txData = verifyData.data;
    const status = txData?.status;

    if (status !== 'success') {
      return new Response(JSON.stringify({
        ok: false,
        pending: status === 'pending' || status === 'initiated',
        status,
        message: `Payment status: ${status}`,
      }), {
        status: status === 'pending' || status === 'initiated' ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract metadata
    const metadata = txData.metadata || {};
    const resolvedReference = metadata.reference || reference || `SV-MNR-${resolvedPaymentId}`;
    const txType = metadata.type || body.type;
    const orgId = metadata.organization_id || body.organization_id;

    if (!txType || !orgId) {
      return new Response(JSON.stringify({ error: 'Missing type or organization_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process through shared core
    const result = await processTransaction(db, {
      reference: resolvedReference,
      type: txType,
      organization_id: orgId,
      gateway: 'moneroo',
      source: 'verify',
      amount_paid: txData.amount,
      currency: txData.currency || 'XOF',
      campaign_id: metadata.campaign_id || body.campaign_id || null,
      product_id: metadata.product_id || body.product_id || null,
      user_id: userId || metadata.user_id || null,
      donor_name: metadata.buyer_name || txData.customer?.firstName + ' ' + txData.customer?.lastName,
      donor_email: metadata.buyer_email || txData.customer?.email,
      affiliate_code: metadata.affiliate_code || body.affiliate_code || null,
      promo_code: metadata.promo_code || body.promo_code || null,
    });

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    if (err instanceof TransactionError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('[moneroo-verify] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
