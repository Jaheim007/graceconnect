// church-init-giving-stripe: Public endpoint for diaspora donors — Stripe Checkout for
// EUR / USD / GBP / CAD gifts to a church (tithe/offering/donation/campaign).
// Creates a pending row in church_donations and returns a Stripe Checkout URL.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TYPES = ['tithe', 'offering', 'donation', 'campaign'] as const;
const ALLOWED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD'] as const;
// Stripe expects cents for these
const zeroDecimal = new Set(['JPY', 'KRW', 'VND']);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function form(o: Record<string, string>) {
  return new URLSearchParams(o).toString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE = Deno.env.get('STRIPE_SECRET_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (!STRIPE) return json({ error: 'Stripe not configured' }, 500);

  try {
    const b = await req.json();
    const churchSlug = String(b.church_slug || '').trim();
    const churchId = String(b.church_id || '').trim();
    const givingType = String(b.giving_type || 'offering');
    const campaignId = b.campaign_id ? String(b.campaign_id) : null;
    const amount = Number(b.amount);
    const currency = String(b.currency || 'USD').toUpperCase();
    const donorName = b.donor_name ? String(b.donor_name).slice(0, 120) : null;
    const donorEmail = b.donor_email ? String(b.donor_email).slice(0, 200) : null;
    const message = b.message ? String(b.message).slice(0, 500) : null;
    const isAnonymous = !!b.is_anonymous;
    const returnOrigin = String(b.return_origin || req.headers.get('origin') || 'https://siteviral.com').replace(/\/$/, '');

    if (!ALLOWED_TYPES.includes(givingType as any)) return json({ error: 'Invalid giving_type' }, 400);
    if (!ALLOWED_CURRENCIES.includes(currency as any)) return json({ error: 'Unsupported currency for Stripe path' }, 400);
    if (!Number.isFinite(amount) || amount < 1) return json({ error: 'Amount must be at least 1' }, 400);
    if (!donorEmail) return json({ error: 'Email required for card payments' }, 400);
    if (!churchSlug && !churchId) return json({ error: 'Church required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY);
    const churchQ = churchId
      ? db.from('church_providers').select('id, slug, name, status').eq('id', churchId)
      : db.from('church_providers').select('id, slug, name, status').eq('slug', churchSlug);
    const { data: church, error: chErr } = await churchQ.maybeSingle();
    if (chErr || !church) return json({ error: 'Church not found' }, 404);
    if (church.status === 'suspended') return json({ error: 'Church not accepting gifts' }, 403);

    let campaign: any = null;
    if (campaignId) {
      const { data: c } = await db.from('church_campaigns').select('id, church_id, title').eq('id', campaignId).maybeSingle();
      if (!c || c.church_id !== church.id) return json({ error: 'Campaign mismatch' }, 400);
      campaign = c;
    }

    const reference = `CHURCH-${crypto.randomUUID()}`;
    const description = campaign
      ? `Gift · ${campaign.title || church.name}`
      : givingType === 'tithe' ? `Tithe · ${church.name}`
      : givingType === 'offering' ? `Offering · ${church.name}`
      : `Gift · ${church.name}`;

    // Insert pending donation row
    const { error: insErr } = await db.from('church_donations').insert({
      church_id: church.id,
      campaign_id: campaign?.id || null,
      donor_name: isAnonymous ? null : donorName,
      donor_email: donorEmail,
      donor_phone: null,
      giving_type: campaign ? 'campaign' : givingType,
      amount,
      currency,
      gateway: 'stripe',
      reference,
      status: 'pending',
      is_anonymous: isAnonymous,
      message,
      metadata: { source: 'church-init-giving-stripe' },
    });
    if (insErr) return json({ error: insErr.message }, 500);

    // Stripe amount unit
    const unitAmount = zeroDecimal.has(currency) ? Math.round(amount) : Math.round(amount * 100);

    const successUrl = `${returnOrigin}/church/${church.slug}/give/success?reference=${reference}`;
    const cancelUrl = `${returnOrigin}/church/${church.slug}/give?status=canceled`;

    const params: Record<string, string> = {
      'mode': 'payment',
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'customer_email': donorEmail,
      'client_reference_id': reference,
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': description,
      'line_items[0][price_data][unit_amount]': String(unitAmount),
      'line_items[0][quantity]': '1',
      'payment_intent_data[description]': description,
      'payment_intent_data[metadata][type]': 'church_giving',
      'payment_intent_data[metadata][sv_reference]': reference,
      'payment_intent_data[metadata][church_id]': church.id,
      'payment_intent_data[metadata][church_slug]': church.slug,
      'payment_intent_data[metadata][giving_type]': campaign ? 'campaign' : givingType,
      'payment_intent_data[metadata][campaign_id]': campaign?.id || '',
      'payment_intent_data[metadata][donor_email]': donorEmail,
      'payment_intent_data[metadata][donor_name]': isAnonymous ? '' : (donorName || ''),
      'metadata[type]': 'church_giving',
      'metadata[sv_reference]': reference,
      'metadata[church_id]': church.id,
      'metadata[church_slug]': church.slug,
      'metadata[giving_type]': campaign ? 'campaign' : givingType,
    };

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form(params),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      await db.from('church_donations').update({
        status: 'failed',
        metadata: { error: data?.error?.message || 'stripe_init_failed' },
      }).eq('reference', reference);
      return json({ error: data?.error?.message || 'Stripe init failed' }, 502);
    }

    await db.from('church_donations').update({
      metadata: { source: 'church-init-giving-stripe', stripe_session_id: data.id },
    }).eq('reference', reference);

    return json({ ok: true, checkout_url: data.url, reference, gateway: 'stripe' });
  } catch (e: any) {
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
