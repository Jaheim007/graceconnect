// beauty-create-booking: creates a beauty_booking row (pending_payment) and
// returns a checkout URL. Routes to GeniusPay for XOF/GHS/KES and to Stripe
// for everything else. Escrow-only (full upfront). MVP.

import { createClient } from 'npm:@supabase/supabase-js@2.57.2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const AFRICA_MOMO_CURRENCIES = new Set(['XOF', 'GHS', 'KES']);
const COMMISSION_PCT = 10; // platform commission

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
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);
    const user = userData.user;

    const body = await req.json();
    const { service_id, slot_start, slot_end, location_type, address, notes } = body;

    if (!service_id || !slot_start || !slot_end) {
      return json({ error: 'service_id, slot_start, slot_end required' }, 400);
    }
    if (!['salon', 'home'].includes(location_type)) {
      return json({ error: 'invalid location_type' }, 400);
    }

    // Service-role db for writes that cross-user (e.g. inserting a booking that
    // will be co-owned by client + provider).
    const db = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Load service
    const { data: service, error: svcErr } = await db
      .from('beauty_services')
      .select(
        'id, provider_id, title, price_amount, price_xof, currency, duration_min, active',
      )
      .eq('id', service_id)
      .maybeSingle();
    if (svcErr || !service || !service.active) {
      return json({ error: 'Service unavailable' }, 404);
    }

    // 2) Load provider (must be active/KYC-approved)
    const { data: provider } = await db
      .from('beauty_providers')
      .select('id, user_id, status, business_name, city')
      .eq('id', service.provider_id)
      .maybeSingle();
    if (!provider || provider.status !== 'active') {
      return json({ error: 'Provider not available' }, 400);
    }
    if (provider.user_id === user.id) {
      return json({ error: 'Cannot book your own service' }, 400);
    }

    const currency = (service.currency || 'XOF').toUpperCase();
    const amount = service.price_amount ?? service.price_xof ?? 0;
    if (!amount || amount < 100) return json({ error: 'Invalid price' }, 400);

    // 3) Guard against slot conflict (basic — a race could still slip through)
    const { data: conflict } = await db
      .from('beauty_bookings')
      .select('id')
      .eq('provider_id', provider.id)
      .not('status', 'in', '(cancelled,refunded,expired)')
      .lt('slot_start', slot_end)
      .gt('slot_end', slot_start)
      .limit(1)
      .maybeSingle();
    if (conflict) return json({ error: 'Slot no longer available' }, 409);

    const commission = Math.round((amount * COMMISSION_PCT) / 100);

    // 4) Insert pending booking
    const { data: booking, error: insErr } = await db
      .from('beauty_bookings')
      .insert({
        service_id: service.id,
        provider_id: provider.id,
        client_id: user.id,
        slot_start,
        slot_end,
        location_type,
        address: address ?? null,
        mode: 'escrow' as any,
        currency,
        price_amount: amount,
        commission_amount: commission,
        price_xof: currency === 'XOF' ? amount : 0,
        commission_xof: currency === 'XOF' ? commission : 0,
        status: 'pending_payment' as any,
      })
      .select('id')
      .single();
    if (insErr || !booking) {
      console.error('[beauty-create-booking] insert failed', insErr);
      return json({ error: 'Booking creation failed' }, 500);
    }

    const origin =
      req.headers.get('origin') ||
      body.return_origin ||
      'https://siteviral.com';
    const successUrl = `${origin.replace(/\/$/, '')}/beauty/bookings/${booking.id}?status=success`;
    const cancelUrl = `${origin.replace(/\/$/, '')}/beauty/bookings/${booking.id}?status=cancelled`;

    // 5) Route to gateway
    const useGeniusPay = AFRICA_MOMO_CURRENCIES.has(currency);

    if (useGeniusPay) {
      if (!GP_KEY || !GP_SECRET) return json({ error: 'GeniusPay not configured' }, 500);

      const gpRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
        method: 'POST',
        headers: {
          'X-API-Key': GP_KEY,
          'X-API-Secret': GP_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency,
          description: `Réservation — ${service.title}`,
          customer: {
            email: user.email,
            name: (user.user_metadata as any)?.full_name,
          },
          success_url: successUrl,
          error_url: cancelUrl,
          metadata: {
            type: 'beauty_booking',
            booking_id: booking.id,
            provider_id: provider.id,
            client_id: user.id,
          },
        }),
      });
      const gpData = await gpRes.json();
      if (!gpRes.ok || !gpData?.success || !gpData?.data?.checkout_url) {
        console.error('[beauty-create-booking] geniuspay fail', gpRes.status, gpData);
        await db.from('beauty_bookings').delete().eq('id', booking.id);
        return json({ error: 'Payment provider error' }, 502);
      }
      await db
        .from('beauty_bookings')
        .update({
          payment_intent_id: gpData.data.reference,
          gateway: 'geniuspay',
        })
        .eq('id', booking.id);

      return json({
        ok: true,
        booking_id: booking.id,
        gateway: 'geniuspay',
        checkout_url: gpData.data.checkout_url,
      });
    }

    // Stripe path
    if (!STRIPE_KEY) return json({ error: 'Stripe not configured' }, 500);
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' as any });

    const isZeroDecimal = ['XOF', 'XAF', 'JPY', 'KRW', 'VND'].includes(currency);
    const stripeAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);

    // Reuse customer by email
    let customerId: string | undefined;
    if (user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: stripeAmount,
            product_data: {
              name: `${service.title} — ${provider.business_name}`,
              description: `Réservation ${new Date(slot_start).toLocaleString('fr-FR')}`,
            },
          },
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        type: 'beauty_booking',
        booking_id: booking.id,
        provider_id: provider.id,
        client_id: user.id,
      },
    });

    await db
      .from('beauty_bookings')
      .update({ payment_intent_id: session.id, gateway: 'stripe' })
      .eq('id', booking.id);

    return json({
      ok: true,
      booking_id: booking.id,
      gateway: 'stripe',
      checkout_url: session.url,
    });
  } catch (e) {
    console.error('[beauty-create-booking] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
