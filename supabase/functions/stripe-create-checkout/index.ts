import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CheckoutBody {
  type: 'donation' | 'product';
  organization_id: string;
  campaign_id?: string;
  product_id?: string;
  amount: number; // in currency units (e.g. 5000 XOF or 50 USD)
  currency: string;
  buyer_name?: string;
  buyer_email: string;
  affiliate_code?: string | null;
  promo_code?: string;
  success_url: string;
  cancel_url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
  if (!STRIPE_SECRET) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await db.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const body: CheckoutBody = await req.json();
    const {
      type, organization_id, campaign_id, product_id,
      amount, currency, buyer_name, buyer_email,
      affiliate_code, promo_code, success_url, cancel_url,
    } = body;

    // Validate
    if (!buyer_email || !amount || amount < 1 || !organization_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load org
    const { data: org } = await db.from('organizations')
      .select('name, platform_fee_percent, affiliation_enabled, affiliation_commission_percent, is_active')
      .eq('id', organization_id)
      .single();

    if (!org?.is_active) {
      return new Response(JSON.stringify({ error: 'Organization inactive' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique reference
    const ref = `SV-STRIPE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Determine Stripe amount (smallest currency unit)
    // Zero-decimal currencies: XOF, XAF, JPY, etc.
    const zeroDecimalCurrencies = ['XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toUpperCase());
    const stripeAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);

    // Product name for Stripe
    let productName = type === 'donation'
      ? `Don — ${org.name}`
      : `Achat — ${org.name}`;

    if (type === 'product' && product_id) {
      const { data: prod } = await db.from('digital_products')
        .select('title')
        .eq('id', product_id)
        .single();
      if (prod) productName = prod.title;
    }

    if (type === 'donation' && campaign_id) {
      const { data: camp } = await db.from('donation_campaigns')
        .select('title')
        .eq('id', campaign_id)
        .single();
      if (camp) productName = `Don — ${camp.title}`;
    }

    // Build metadata for webhook processing
    const metadata: Record<string, string> = {
      sv_reference: ref,
      type,
      organization_id,
      buyer_email,
      gateway: 'stripe',
    };
    if (campaign_id) metadata.campaign_id = campaign_id;
    if (product_id) metadata.product_id = product_id;
    if (buyer_name) metadata.buyer_name = buyer_name;
    if (userId) metadata.user_id = userId;
    if (affiliate_code) metadata.affiliate_code = affiliate_code;
    if (promo_code) metadata.promo_code = promo_code;

    // Append reference to success URL
    const successUrlWithRef = `${success_url}${success_url.includes('?') ? '&' : '?'}reference=${ref}&gateway=stripe`;

    // Create Stripe Checkout Session via API
    const stripeParams = new URLSearchParams();
    stripeParams.append('mode', 'payment');
    stripeParams.append('success_url', successUrlWithRef);
    stripeParams.append('cancel_url', cancel_url);
    stripeParams.append('customer_email', buyer_email);
    stripeParams.append('line_items[0][price_data][currency]', currency.toLowerCase());
    stripeParams.append('line_items[0][price_data][product_data][name]', productName);
    stripeParams.append('line_items[0][price_data][unit_amount]', String(stripeAmount));
    stripeParams.append('line_items[0][quantity]', '1');
    stripeParams.append('payment_intent_data[metadata][sv_reference]', ref);

    // Add all metadata
    for (const [key, val] of Object.entries(metadata)) {
      stripeParams.append(`payment_intent_data[metadata][${key}]`, val);
      stripeParams.append(`metadata[${key}]`, val);
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeParams.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[stripe-create-checkout] Stripe error:', session);
      return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      checkout_url: session.url,
      reference: ref,
      session_id: session.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[stripe-create-checkout] error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
