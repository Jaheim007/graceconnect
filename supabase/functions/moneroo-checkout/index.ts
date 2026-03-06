import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * moneroo-checkout: Initialize a payment via Moneroo API.
 * Returns a checkout_url to redirect the user.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MONEROO_API = 'https://api.moneroo.io/v1';

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
    const {
      type, organization_id, campaign_id, product_id,
      amount, currency, buyer_name, buyer_email,
      affiliate_code, promo_code, return_url,
    } = body;

    if (!amount || !currency || !buyer_email || !organization_id || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields: amount, currency, buyer_email, organization_id, type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve user if authenticated
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await db.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Generate a unique reference
    const reference = `SV-MNR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Build Moneroo payment initialization payload
    const nameParts = (buyer_name || 'Customer').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '-';

    const monerooPayload: Record<string, unknown> = {
      amount: Math.round(amount), // Moneroo expects integer
      currency: currency.toUpperCase(),
      description: type === 'donation'
        ? `Don pour ${organization_id}`
        : `Achat produit ${product_id || ''}`,
      customer: {
        email: buyer_email,
        first_name: firstName,
        last_name: lastName,
      },
      return_url: return_url || `${req.headers.get('origin') || 'https://graceconnect.lovable.app'}/payment/success?gateway=moneroo&reference=${reference}`,
      metadata: Object.fromEntries(
        Object.entries({
          reference,
          type,
          organization_id,
          campaign_id: campaign_id || undefined,
          product_id: product_id || undefined,
          user_id: userId || undefined,
          buyer_name: buyer_name || undefined,
          affiliate_code: affiliate_code || undefined,
          promo_code: promo_code || undefined,
        }).filter(([, v]) => v !== undefined && v !== null)
      ),
    };

    // Call Moneroo API
    const monerooRes = await fetch(`${MONEROO_API}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MONEROO_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(monerooPayload),
    });

    const monerooData = await monerooRes.json();

    if (!monerooRes.ok || !monerooData?.data?.checkout_url) {
      console.error('[moneroo-checkout] API error:', monerooRes.status, monerooData);
      return new Response(JSON.stringify({
        error: monerooData?.message || 'Failed to initialize Moneroo payment',
        details: monerooData,
      }), {
        status: monerooRes.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store the payment_id mapping for later verification
    const paymentId = monerooData.data.id;

    // Log in payment_events for idempotency tracking
    await db.from('payment_events').insert({
      event_id: `moneroo_init_${reference}`,
      event_type: 'moneroo.payment.initialized',
      gateway: 'moneroo',
      reference,
      payload: {
        moneroo_payment_id: paymentId,
        amount,
        currency,
        type,
        organization_id,
        campaign_id,
        product_id,
        user_id: userId,
        buyer_name,
        buyer_email,
        affiliate_code,
        promo_code,
      },
    }).then(() => {}).catch((err: unknown) => {
      console.warn('[moneroo-checkout] Failed to log payment event (non-fatal):', err);
    });

    return new Response(JSON.stringify({
      checkout_url: monerooData.data.checkout_url,
      payment_id: paymentId,
      reference,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[moneroo-checkout] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
