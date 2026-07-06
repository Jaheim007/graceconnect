// church-init-giving: Public endpoint that starts a giving session (tithe, offering,
// donation, or campaign) for a church using GeniusPay hosted checkout.
// - Creates a pending row in church_donations
// - Calls GeniusPay to create checkout URL
// - Returns checkout URL + reference
// No auth required (givers can be anonymous).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GP_BASE = 'https://geniuspay.ci/api/v1/merchant';
const ALLOWED_TYPES = ['tithe', 'offering', 'donation', 'campaign'] as const;
const ALLOWED_CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD'] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const API_KEY = Deno.env.get('GENIUSPAY_API_KEY');
  const API_SECRET = Deno.env.get('GENIUSPAY_API_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!API_KEY || !API_SECRET) return json({ error: 'GeniusPay not configured' }, 500);

  try {
    const body = await req.json();
    const churchSlug = String(body.church_slug || '').trim();
    const churchId = String(body.church_id || '').trim();
    const givingType = String(body.giving_type || 'offering');
    const campaignId = body.campaign_id ? String(body.campaign_id) : null;
    const amount = Number(body.amount);
    const currency = String(body.currency || 'XOF').toUpperCase();
    const donorName = body.donor_name ? String(body.donor_name).slice(0, 120) : null;
    const donorEmail = body.donor_email ? String(body.donor_email).slice(0, 200) : null;
    const donorPhone = body.donor_phone ? String(body.donor_phone).slice(0, 40) : null;
    const message = body.message ? String(body.message).slice(0, 500) : null;
    const isAnonymous = !!body.is_anonymous;
    const returnOrigin = String(body.return_origin || req.headers.get('origin') || 'https://siteviral.com').replace(/\/$/, '');

    if (!ALLOWED_TYPES.includes(givingType as any)) return json({ error: 'Invalid giving_type' }, 400);
    if (!ALLOWED_CURRENCIES.includes(currency as any)) return json({ error: 'Unsupported currency' }, 400);
    if (!Number.isFinite(amount) || amount < 100) return json({ error: 'Amount must be at least 100' }, 400);
    if (!donorEmail && !donorPhone) return json({ error: 'Provide email or phone' }, 400);
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
      const { data: c } = await db.from('church_campaigns').select('id, church_id, status, currency').eq('id', campaignId).maybeSingle();
      if (!c || c.church_id !== church.id) return json({ error: 'Campaign mismatch' }, 400);
      campaign = c;
    }

    // Currency handling: GeniusPay accepts XOF / EUR / USD directly. XAF passes through as XOF.
    const gpCurrency = currency === 'XAF' ? 'XOF' : currency;
    const reference = `CHURCH-${crypto.randomUUID()}`;

    // Insert pending donation row
    const { error: insErr } = await db.from('church_donations').insert({
      church_id: church.id,
      campaign_id: campaign?.id || null,
      donor_name: isAnonymous ? null : donorName,
      donor_email: donorEmail,
      donor_phone: donorPhone,
      giving_type: campaign ? 'campaign' : givingType,
      amount,
      currency,
      gateway: 'geniuspay',
      reference,
      status: 'pending',
      is_anonymous: isAnonymous,
      message,
      metadata: { source: 'church-init-giving' },
    });
    if (insErr) return json({ error: insErr.message }, 500);

    const description = campaign
      ? `Don · ${campaign.title || church.name}`
      : givingType === 'tithe' ? `Dîme · ${church.name}`
      : givingType === 'offering' ? `Offrande · ${church.name}`
      : `Don · ${church.name}`;

    const gpPayload = {
      amount: Math.round(amount),
      currency: gpCurrency,
      description,
      customer: {
        name: isAnonymous ? undefined : (donorName || undefined),
        email: donorEmail || undefined,
        phone: donorPhone || undefined,
      },
      success_url: `${returnOrigin}/church/${church.slug}/give/success?reference=${reference}`,
      error_url: `${returnOrigin}/church/${church.slug}/give?status=failed`,
      metadata: {
        type: 'church_giving',
        church_id: church.id,
        church_slug: church.slug,
        campaign_id: campaign?.id || null,
        giving_type: campaign ? 'campaign' : givingType,
        donor_email: donorEmail,
        donor_name: isAnonymous ? null : donorName,
        reference,
      },
    };

    const gpRes = await fetch(`${GP_BASE}/payments`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY, 'X-API-Secret': API_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify(gpPayload),
    });
    const gpData = await gpRes.json();
    if (!gpRes.ok || !gpData?.success || !gpData?.data?.checkout_url) {
      await db.from('church_donations').update({
        status: 'failed',
        metadata: { error: gpData?.error?.message || 'gp_init_failed', gp_status: gpRes.status },
      }).eq('reference', reference);
      return json({ error: gpData?.error?.message || 'Payment init failed', status: gpRes.status }, 502);
    }

    // Store the GeniusPay reference alongside ours (they use their own)
    const gpReference = gpData.data.reference as string;
    await db.from('church_donations').update({
      metadata: { source: 'church-init-giving', gp_reference: gpReference },
    }).eq('reference', reference);

    return json({
      ok: true,
      checkout_url: gpData.data.checkout_url,
      reference,
      gp_reference: gpReference,
      environment: gpData.data.environment,
    });
  } catch (e: any) {
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
