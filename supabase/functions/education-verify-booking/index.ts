// education-verify-booking: promote awaiting_payment → confirmed after Stripe
// redirect. Idempotent. GeniusPay path handled by geniuspay-webhook.
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

  try {
    const { booking_id, session_id } = await req.json();
    if (!booking_id) return json({ error: 'booking_id required' }, 400);
    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: booking } = await db.from('education_bookings')
      .select('id, status, payment_ref, payment_status, offer_id')
      .eq('id', booking_id).maybeSingle();
    if (!booking) return json({ error: 'Booking not found' }, 404);
    if (booking.status !== 'awaiting_payment') {
      return json({ ok: true, status: booking.status, already: true });
    }

    if (!STRIPE_KEY) return json({ error: 'Stripe not configured' }, 500);
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' as any });
    const sid = session_id || booking.payment_ref;
    if (!sid) return json({ ok: false, status: booking.status });
    const session = await stripe.checkout.sessions.retrieve(sid);
    if (session.payment_status === 'paid') {
      await db.from('education_bookings').update({
        status: 'confirmed',
        payment_status: 'paid',
      }).eq('id', booking_id);
      if (booking.offer_id) {
        await db.from('education_offers').update({
          status: 'accepted', accepted_at: new Date().toISOString(),
        }).eq('id', booking.offer_id);
      }
      await db.from('education_booking_events').insert({
        booking_id, event_type: 'payment_confirmed',
        meta: { gateway: 'stripe', session_id: sid },
      });
      return json({ ok: true, status: 'confirmed' });
    }
    return json({ ok: false, status: booking.status, payment_status: session.payment_status });
  } catch (e) {
    console.error('[education-verify-booking] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
