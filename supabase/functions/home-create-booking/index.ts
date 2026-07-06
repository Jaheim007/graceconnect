// home-create-booking: client accepts a Home offer → creates a home_bookings row
// in `pending_payment` and returns a checkout URL. Routes to GeniusPay for
// XOF/GHS/KES and to Stripe for everything else. Escrow-only (full upfront).
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const AFRICA_MOMO_CURRENCIES = new Set(['XOF', 'GHS', 'KES']);
const COMMISSION_PCT = 10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
  const GP_KEY = Deno.env.get('GENIUSPAY_API_KEY') || '';
  const GP_SECRET = Deno.env.get('GENIUSPAY_API_SECRET') || '';

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));
    const user = userData.user;
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { offer_id, return_origin } = body;
    if (!offer_id) return json({ error: 'offer_id required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // 1) Load offer
    const { data: offer } = await db.from('home_offers')
      .select('id, conversation_id, provider_id, client_id, title, description, price, currency, scheduled_for, address, status')
      .eq('id', offer_id).maybeSingle();
    if (!offer) return json({ error: 'Offer not found' }, 404);
    if (offer.client_id !== user.id) return json({ error: 'Only client can accept' }, 403);
    if (!['sent', 'draft'].includes(offer.status)) return json({ error: 'Offer no longer available' }, 400);

    const { data: provider } = await db.from('home_providers')
      .select('id, user_id, status, business_name').eq('id', offer.provider_id).maybeSingle();
    if (!provider || provider.status !== 'active') return json({ error: 'Provider not available' }, 400);

    const currency = String(offer.currency || 'XOF').toUpperCase();
    const amount = Number(offer.price);
    if (!amount || amount < 100) return json({ error: 'Invalid price' }, 400);
    const commission = Math.round((amount * COMMISSION_PCT) / 100);

    // 2) Reuse pending booking for this offer if the client re-clicks
    const { data: existing } = await db.from('home_bookings')
      .select('id, status, gateway, payment_intent_id')
      .eq('offer_id', offer.id).maybeSingle();

    let bookingId = existing?.id as string | undefined;
    if (!existing) {
      const { data: inserted, error: insErr } = await db.from('home_bookings').insert({
        offer_id: offer.id,
        provider_id: offer.provider_id,
        client_id: offer.client_id,
        address: offer.address,
        scheduled_for: offer.scheduled_for,
        price: amount,
        commission,
        currency,
        status: 'pending_payment',
      }).select('id').single();
      if (insErr || !inserted) {
        console.error('[home-create-booking] insert failed', insErr);
        return json({ error: 'Booking creation failed' }, 500);
      }
      bookingId = inserted.id;
    } else if (existing.status !== 'pending_payment') {
      return json({ error: 'Booking already ' + existing.status }, 400);
    }

    const origin = req.headers.get('origin') || return_origin || 'https://siteviral.com';
    const base = origin.replace(/\/$/, '');
    const successUrl = `${base}/home/booking/${bookingId}?status=success`;
    const cancelUrl = `${base}/home/booking/${bookingId}?status=cancelled`;

    // 3) Route to gateway
    const useGeniusPay = AFRICA_MOMO_CURRENCIES.has(currency);
    if (useGeniusPay) {
      if (!GP_KEY || !GP_SECRET) return json({ error: 'GeniusPay not configured' }, 500);
      const gpRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
        method: 'POST',
        headers: { 'X-API-Key': GP_KEY, 'X-API-Secret': GP_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency,
          description: `SiteViral Home — ${offer.title}`.slice(0, 120),
          customer: { email: user.email, name: (user.user_metadata as any)?.full_name },
          success_url: successUrl,
          error_url: cancelUrl,
          metadata: {
            type: 'home_booking',
            booking_id: bookingId,
            provider_id: offer.provider_id,
            client_id: user.id,
          },
        }),
      });
      const gp = await gpRes.json();
      if (!gpRes.ok || !gp?.success || !gp?.data?.checkout_url) {
        console.error('[home-create-booking] geniuspay fail', gpRes.status, gp);
        return json({ error: 'Payment provider error' }, 502);
      }
      await db.from('home_bookings').update({
        gateway: 'geniuspay', payment_intent_id: gp.data.reference,
      }).eq('id', bookingId);
      return json({ ok: true, booking_id: bookingId, gateway: 'geniuspay', checkout_url: gp.data.checkout_url });
    }

    // Stripe
    if (!STRIPE_KEY) return json({ error: 'Stripe not configured' }, 500);
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' as any });
    const isZeroDecimal = ['XOF', 'XAF', 'JPY', 'KRW', 'VND'].includes(currency);
    const stripeAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);

    let customerId: string | undefined;
    if (user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id;
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email ?? undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: stripeAmount,
          product_data: {
            name: `${offer.title} — ${provider.business_name}`.slice(0, 120),
            description: (offer.description || '').slice(0, 300) || undefined,
          },
        },
      }],
      mode: 'payment',
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        type: 'home_booking',
        booking_id: String(bookingId),
        provider_id: offer.provider_id,
        client_id: user.id,
      },
    });
    await db.from('home_bookings').update({
      gateway: 'stripe', payment_intent_id: session.id,
    }).eq('id', bookingId);

    return json({ ok: true, booking_id: bookingId, gateway: 'stripe', checkout_url: session.url });
  } catch (e) {
    console.error('[home-create-booking] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
