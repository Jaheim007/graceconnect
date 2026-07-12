// geniuspay-init: Initialize a GeniusPay hosted-checkout payment session.
// Returns a `checkout_url` that the frontend redirects the buyer to.
// On success, GeniusPay redirects the buyer to success_url (with ?reference=MTX-...).
// The actual transaction commit happens server-side via geniuspay-webhook.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GP_BASE = 'https://geniuspay.ci/api/v1/merchant';

interface InitBody {
  amount: number;
  currency?: string;
  email: string;
  customer_name?: string;
  customer_phone?: string;
  description?: string;
  type: 'donation' | 'product' | 'credit_purchase' | 'template_clone' | 'platform_subscription';
  organization_id?: string;
  campaign_id?: string;
  product_id?: string;
  purchase_id?: string;
  buyer_name?: string;
  affiliate_code?: string;
  promo_code?: string;
  return_origin?: string; // e.g. https://siteviral.com — for multi-domain support
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const API_KEY = Deno.env.get('GENIUSPAY_API_KEY');
  const API_SECRET = Deno.env.get('GENIUSPAY_API_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

  if (!API_KEY || !API_SECRET) {
    return new Response(JSON.stringify({ error: 'GeniusPay not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: InitBody = await req.json();

    // Auth policy:
    //  - Donations may be anonymous (guest donors are supported by the /donate UI).
    //  - All other purchase types (product, credit_purchase, template_clone, platform_subscription)
    //    still require a valid Bearer token.
    const authHeader = req.headers.get('Authorization');
    const isDonation = body.type === 'donation';
    let userId: string | null = null;
    let userEmail = '';

    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(
        authHeader.replace('Bearer ', ''),
      );
      if (!claimsErr && claimsData?.claims) {
        userId = claimsData.claims.sub as string;
        userEmail = (claimsData.claims.email as string | undefined) || '';
      } else if (!isDonation) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (!isDonation) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 200) {
      return new Response(JSON.stringify({ error: 'amount must be >= 200 XOF' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currency = (body.currency || 'XOF').toUpperCase();
    // GeniusPay accepts XOF, EUR, USD; convert anything else to XOF passthrough
    const gpCurrency = ['XOF', 'EUR', 'USD'].includes(currency) ? currency : 'XOF';

    // Origin for return URL (multi-domain aware)
    const origin = (body.return_origin || req.headers.get('origin') || 'https://siteviral.com').replace(/\/$/, '');

    // Merge metadata. GeniusPay returns it as-is in webhooks.
    const metadata: Record<string, unknown> = {
      type: body.type,
      user_id: userId,
      organization_id: body.organization_id || null,
      campaign_id: body.campaign_id || null,
      product_id: body.product_id || null,
      purchase_id: body.purchase_id || null,
      buyer_name: body.buyer_name || null,
      affiliate_code: body.affiliate_code || null,
      promo_code: body.promo_code || null,
      ...(body.metadata || {}),
    };

    // Strip null/undefined to keep metadata clean
    Object.keys(metadata).forEach((k) => {
      if (metadata[k] == null) delete metadata[k];
    });

    const description =
      body.description ||
      (body.type === 'donation'
        ? 'Don sur SiteViral'
        : body.type === 'credit_purchase'
        ? 'Achat de crédits SiteViral'
        : body.type === 'platform_subscription'
        ? 'Abonnement SiteViral'
        : 'Achat sur SiteViral');

    const gpPayload: Record<string, unknown> = {
      amount: Math.round(amount), // XOF/EUR/USD are integer units in GeniusPay (XOF is zero-decimal)
      currency: gpCurrency,
      description,
      customer: {
        name: body.customer_name || body.buyer_name || undefined,
        email: body.email || userEmail || undefined,
        phone: body.customer_phone || undefined,
      },
      success_url: `${origin}/payment/success?gateway=geniuspay&type=${encodeURIComponent(body.type)}${body.organization_id ? `&organization_id=${body.organization_id}` : ''}${body.product_id ? `&product_id=${body.product_id}` : ''}${body.campaign_id ? `&campaign_id=${body.campaign_id}` : ''}`,
      error_url: `${origin}/payment/success?gateway=geniuspay&status=failed`,
      metadata,
    };

    const gpRes = await fetch(`${GP_BASE}/payments`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gpPayload),
    });

    const gpData = await gpRes.json();

    if (!gpRes.ok || !gpData?.success || !gpData?.data?.checkout_url) {
      console.error('[geniuspay-init] GP API failed:', gpRes.status, JSON.stringify(gpData));
      return new Response(
        JSON.stringify({ error: gpData?.error?.message || gpData?.message || 'GeniusPay init failed', status: gpRes.status }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const reference = gpData.data.reference as string;

    return new Response(
      JSON.stringify({
        ok: true,
        checkout_url: gpData.data.checkout_url,
        reference,
        amount: gpData.data.amount,
        currency: gpData.data.currency,
        environment: gpData.data.environment,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('[geniuspay-init] error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
