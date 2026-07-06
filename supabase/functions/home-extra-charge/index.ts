// home-extra-charge: provider requests an in-service surcharge; client accepts
// (creates a checkout URL) or declines. Mirrors beauty-extra-charge.
// Actions: create | accept | decline
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const AFRICA_MOMO_CURRENCIES = new Set(['XOF', 'GHS', 'KES']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
  const GP_KEY = Deno.env.get('GENIUSPAY_API_KEY') || '';
  const GP_SECRET = Deno.env.get('GENIUSPAY_API_SECRET') || '';

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));
    const user = userData.user;
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const action = String(body.action || '');
    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    if (action === 'create') {
      const { booking_id, amount, description } = body;
      if (!booking_id || !amount || !description) return json({ error: 'booking_id, amount, description required' }, 400);
      if (Number(amount) < 100) return json({ error: 'Amount too small' }, 400);
      if (String(description).trim().length < 3) return json({ error: 'Description too short' }, 400);

      const { data: bk } = await db.from('home_bookings')
        .select('id, provider_id, client_id, currency, status, started_at').eq('id', booking_id).maybeSingle();
      if (!bk) return json({ error: 'Booking not found' }, 404);
      if (!bk.started_at || bk.status !== 'in_progress') return json({ error: 'Service not started' }, 400);

      const { data: prov } = await db.from('home_providers').select('id, user_id').eq('id', bk.provider_id).maybeSingle();
      if (!prov || prov.user_id !== user.id) return json({ error: 'Only the provider can request' }, 403);

      const { data: charge, error } = await db.from('home_extra_charges').insert({
        booking_id: bk.id,
        provider_id: bk.provider_id,
        client_id: bk.client_id,
        label: String(description).trim().slice(0, 80),
        description: String(description).trim().slice(0, 300),
        amount: Math.round(Number(amount)),
        currency: String(bk.currency || 'XOF').toUpperCase(),
        status: 'proposed',
      }).select('*').single();
      if (error || !charge) return json({ error: error?.message || 'insert failed' }, 500);

      const { data: conv } = await db.from('home_conversations')
        .select('id').eq('provider_id', bk.provider_id).eq('client_id', bk.client_id).maybeSingle();
      if (conv) {
        await db.from('home_messages').insert({
          conversation_id: conv.id,
          sender_id: user.id,
          kind: 'extra_charge',
          extra_charge_id: charge.id,
          body: `Supplément demandé: ${description} — ${amount} ${charge.currency}`,
        });
      }
      return json({ ok: true, extra_charge: charge });
    }

    if (action === 'decline') {
      const { extra_charge_id } = body;
      const { data: ec } = await db.from('home_extra_charges').select('*').eq('id', extra_charge_id).maybeSingle();
      if (!ec) return json({ error: 'Not found' }, 404);
      if (ec.client_id !== user.id) return json({ error: 'Only client can decline' }, 403);
      if (ec.status !== 'proposed') return json({ ok: true, already: true });
      await db.from('home_extra_charges').update({ status: 'declined' }).eq('id', extra_charge_id);
      return json({ ok: true, status: 'declined' });
    }

    if (action === 'accept') {
      const { extra_charge_id, return_origin } = body;
      const { data: ec } = await db.from('home_extra_charges').select('*').eq('id', extra_charge_id).maybeSingle();
      if (!ec) return json({ error: 'Not found' }, 404);
      if (ec.client_id !== user.id) return json({ error: 'Only client can accept' }, 403);
      if (ec.status !== 'proposed') return json({ error: 'Already resolved' }, 400);
      if (ec.expires_at && new Date(ec.expires_at).getTime() < Date.now()) {
        await db.from('home_extra_charges').update({ status: 'declined' }).eq('id', ec.id);
        return json({ error: 'Request expired' }, 410);
      }

      const origin = req.headers.get('origin') || return_origin || 'https://siteviral.com';
      const base = origin.replace(/\/$/, '');
      const successUrl = `${base}/home/booking/${ec.booking_id}?extra=success`;
      const cancelUrl = `${base}/home/booking/${ec.booking_id}?extra=cancelled`;
      const currency = String(ec.currency).toUpperCase();
      const amount = Number(ec.amount);

      if (AFRICA_MOMO_CURRENCIES.has(currency)) {
        if (!GP_KEY || !GP_SECRET) return json({ error: 'GeniusPay not configured' }, 500);
        const gpRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
          method: 'POST',
          headers: { 'X-API-Key': GP_KEY, 'X-API-Secret': GP_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(amount), currency,
            description: `Supplément — ${ec.description || ec.label}`.slice(0, 120),
            customer: { email: user.email, name: (user.user_metadata as any)?.full_name },
            success_url: successUrl, error_url: cancelUrl,
            metadata: { type: 'home_extra_charge', extra_charge_id: ec.id, booking_id: ec.booking_id, client_id: user.id },
          }),
        });
        const gp = await gpRes.json();
        if (!gpRes.ok || !gp?.success || !gp?.data?.checkout_url) {
          console.error('[home-extra-charge] geniuspay fail', gpRes.status, gp);
          return json({ error: 'Payment provider error' }, 502);
        }
        await db.from('home_extra_charges').update({
          payment_intent_id: gp.data.reference, gateway: 'geniuspay',
        }).eq('id', ec.id);
        return json({ ok: true, checkout_url: gp.data.checkout_url, gateway: 'geniuspay' });
      }

      if (!STRIPE_KEY) return json({ error: 'Stripe not configured' }, 500);
      const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' as any });
      const isZeroDecimal = ['XOF', 'XAF', 'JPY', 'KRW', 'VND'].includes(currency);
      const stripeAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email ?? undefined,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(), unit_amount: stripeAmount,
            product_data: { name: `Supplément — ${ec.description || ec.label}`.slice(0, 120) },
          },
        }],
        mode: 'payment',
        success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: { type: 'home_extra_charge', extra_charge_id: ec.id, booking_id: ec.booking_id, client_id: user.id },
      });
      await db.from('home_extra_charges').update({
        payment_intent_id: session.id, gateway: 'stripe',
      }).eq('id', ec.id);
      return json({ ok: true, checkout_url: session.url, gateway: 'stripe' });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    console.error('[home-extra-charge] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
