// geniuspay-verify: Server-to-server verification of a GeniusPay payment by reference.
// Called from the /payment/success page as a fallback when the webhook is delayed.
// If GeniusPay reports `completed`, we run the same processTransaction() path used by the webhook.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processTransaction } from '../_shared/process-transaction.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GP_BASE = 'https://geniuspay.ci/api/v1/merchant';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const API_KEY = Deno.env.get('GENIUSPAY_API_KEY');
  const API_SECRET = Deno.env.get('GENIUSPAY_API_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

  if (!API_KEY || !API_SECRET) {
    return new Response(JSON.stringify({ error: 'GeniusPay not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Guest checkout must be able to confirm its own payment, so auth is
    // optional here. Safety comes from the reference: it is a high-entropy
    // provider value, it is only ever verified against GeniusPay, and the
    // commit path (processTransaction) is idempotent.
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      await userClient.auth.getClaims(authHeader.replace('Bearer ', '')).catch(() => null);
    }

    const { reference } = await req.json();
    if (
      !reference ||
      typeof reference !== 'string' ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{5,79}$/.test(reference)
    ) {
      return new Response(JSON.stringify({ error: 'reference required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const gpRes = await fetch(`${GP_BASE}/payments/${encodeURIComponent(reference)}`, {
      headers: {
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET,
      },
    });
    const gpData = await gpRes.json();
    if (!gpRes.ok || !gpData?.success) {
      return new Response(JSON.stringify({ ok: false, error: gpData?.error?.message || 'Verification failed', status: gpData?.data?.status || null }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tx = gpData.data;
    if (tx.status !== 'completed') {
      return new Response(JSON.stringify({ ok: false, status: tx.status }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Already-completed path: idempotently commit via processTransaction
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const meta = (tx.metadata as Record<string, any>) || {};
    const type = meta.type as string | undefined;
    const organizationId = meta.organization_id as string | undefined;

    if (type === 'credit_purchase' && meta.purchase_id) {
      await db.rpc('complete_credit_purchase', {
        _purchase_id: meta.purchase_id,
        _payment_reference: reference,
      });
      return new Response(JSON.stringify({ ok: true, kind: 'credit_purchase', reference }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!organizationId) {
      return new Response(JSON.stringify({ ok: true, info: 'no_org_metadata', reference }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await processTransaction(db, {
      reference,
      type: (type === 'product' ? 'product' : 'donation') as 'donation' | 'product',
      organization_id: organizationId,
      gateway: 'geniuspay' as any,
      source: 'verify',
      amount_paid: Number(tx.amount),
      currency: tx.currency || 'XOF',
      campaign_id: meta.campaign_id,
      product_id: meta.product_id,
      user_id: meta.user_id,
      donor_name: meta.buyer_name || tx.customer?.name,
      donor_email: meta.buyer_email || tx.customer?.email,
      buyer_name: meta.buyer_name,
      buyer_email: meta.buyer_email || tx.customer?.email,
      affiliate_code: meta.affiliate_code,
      promo_code: meta.promo_code,
    });

    return new Response(JSON.stringify({ ok: true, ...result, reference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[geniuspay-verify] error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
