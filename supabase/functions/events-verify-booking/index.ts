// events-verify-booking: called on the success page after Stripe redirect.
// Promotes pending_payment → confirmed / deposit_paid if the checkout is paid. Idempotent.
// GeniusPay path is handled by geniuspay-webhook (source of truth).
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

    const { data: booking } = await db.from('events_bookings')
      .select('id, status, gateway, payment_intent_id, event_date, offer_id, price, balance_due')
      .eq('id', booking_id).maybeSingle();
    if (!booking) return json({ error: 'Booking not found' }, 404);
    if (booking.status !== 'pending_payment') {
      return json({ ok: true, status: booking.status, already: true });
    }

    if (booking.gateway === 'stripe') {
      if (!STRIPE_KEY) return json({ error: 'Stripe not configured' }, 500);
      const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' as any });
      const sid = session_id || booking.payment_intent_id;
      if (!sid) return json({ ok: false, status: booking.status });
      const session = await stripe.checkout.sessions.retrieve(sid);
      if (session.payment_status === 'paid') {
        const isDeposit = Number(booking.balance_due) > 0;
        const baseline = booking.event_date ? new Date(booking.event_date) : new Date();
        const autoRelease = new Date(baseline.getTime() + 48 * 60 * 60 * 1000).toISOString();
        const amountPaid = Number(session.amount_total ?? 0) / (['xof','xaf','jpy','krw','vnd'].includes(String(session.currency).toLowerCase()) ? 1 : 100);
        await db.from('events_bookings').update({
          status: isDeposit ? 'deposit_paid' : 'confirmed',
          confirmed_at: new Date().toISOString(),
          auto_release_at: autoRelease,
          escrow_status: 'held',
          deposit_paid: amountPaid || Number(booking.price) - Number(booking.balance_due),
        }).eq('id', booking_id);
        if (booking.offer_id) {
          await db.from('events_offers').update({ status: 'accepted' }).eq('id', booking.offer_id);
        }
        await db.from('events_booking_events').insert({
          booking_id, kind: 'payment_confirmed',
          meta: { gateway: 'stripe', session_id: sid, is_deposit: isDeposit },
        });
        return json({ ok: true, status: isDeposit ? 'deposit_paid' : 'confirmed' });
      }
      return json({ ok: false, status: booking.status, payment_status: session.payment_status });
    }
    return json({ ok: true, status: booking.status, gateway: booking.gateway });
  } catch (e) {
    console.error('[events-verify-booking] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
