// education-create-booking: student accepts an Education offer → creates an
// education_bookings row in awaiting_payment and returns a checkout URL.
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
    const { offer_id, scheduled_at, mode, location_address, meeting_url, return_origin } = body;
    if (!offer_id) return json({ error: 'offer_id required' }, 400);
    if (!scheduled_at) return json({ error: 'scheduled_at required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: offer } = await db.from('education_offers')
      .select('id, conversation_id, tutor_id, student_id, subject, mode, session_count, duration_min, rate_xof, total_xof, description, status')
      .eq('id', offer_id).maybeSingle();
    if (!offer) return json({ error: 'Offer not found' }, 404);
    if (offer.student_id !== user.id) return json({ error: 'Only student can accept' }, 403);
    if (offer.status !== 'pending') return json({ error: 'Offer no longer available' }, 400);

    const { data: tutor } = await db.from('education_tutors')
      .select('id, user_id, is_active, display_name').eq('id', offer.tutor_id).maybeSingle();
    if (!tutor || !tutor.is_active) return json({ error: 'Tutor not available' }, 400);

    const amount = Number(offer.total_xof);
    if (!amount || amount < 100) return json({ error: 'Invalid price' }, 400);
    const commission = Math.round((amount * COMMISSION_PCT) / 100);
    const currency = 'XOF';

    const { data: existing } = await db.from('education_bookings')
      .select('id, status, payment_ref')
      .eq('offer_id', offer.id).maybeSingle();

    let bookingId = existing?.id as string | undefined;
    if (!existing) {
      const { data: inserted, error: insErr } = await db.from('education_bookings').insert({
        offer_id: offer.id,
        conversation_id: offer.conversation_id,
        tutor_id: offer.tutor_id,
        student_id: offer.student_id,
        subject: offer.subject,
        mode: mode || offer.mode,
        scheduled_at,
        duration_min: offer.duration_min,
        session_count: offer.session_count,
        location_address: location_address || null,
        meeting_url: meeting_url || null,
        total_xof: amount,
        platform_fee_xof: commission,
        tutor_earnings_xof: amount - commission,
        status: 'awaiting_payment',
      }).select('id').single();
      if (insErr || !inserted) {
        console.error('[education-create-booking] insert failed', insErr);
        return json({ error: 'Booking creation failed' }, 500);
      }
      bookingId = inserted.id;
    } else if (existing.status !== 'awaiting_payment') {
      return json({ error: 'Booking already ' + existing.status }, 400);
    }

    const origin = req.headers.get('origin') || return_origin || 'https://siteviral.com';
    const base = origin.replace(/\/$/, '');
    const successUrl = `${base}/education/booking/${bookingId}?status=success`;
    const cancelUrl = `${base}/education/booking/${bookingId}?status=cancelled`;

    const useGeniusPay = AFRICA_MOMO_CURRENCIES.has(currency);
    if (useGeniusPay) {
      if (!GP_KEY || !GP_SECRET) return json({ error: 'GeniusPay not configured' }, 500);
      const gpRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
        method: 'POST',
        headers: { 'X-API-Key': GP_KEY, 'X-API-Secret': GP_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount), currency,
          description: `SiteViral Education — ${offer.subject}`.slice(0, 120),
          customer: { email: user.email, name: (user.user_metadata as any)?.full_name },
          success_url: successUrl, error_url: cancelUrl,
          metadata: {
            type: 'education_booking',
            booking_id: bookingId, tutor_id: offer.tutor_id, student_id: user.id,
          },
        }),
      });
      const gp = await gpRes.json();
      if (!gpRes.ok || !gp?.success || !gp?.data?.checkout_url) {
        console.error('[education-create-booking] geniuspay fail', gpRes.status, gp);
        return json({ error: 'Payment provider error' }, 502);
      }
      await db.from('education_bookings').update({
        payment_ref: gp.data.reference,
      }).eq('id', bookingId);
      return json({ ok: true, booking_id: bookingId, gateway: 'geniuspay', checkout_url: gp.data.checkout_url });
    }

    if (!STRIPE_KEY) return json({ error: 'Stripe not configured' }, 500);
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' as any });
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email ?? undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'xof', unit_amount: Math.round(amount),
          product_data: {
            name: `${offer.subject} — ${tutor.display_name}`.slice(0, 120),
            description: (offer.description || '').slice(0, 300) || undefined,
          },
        },
      }],
      mode: 'payment',
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        type: 'education_booking',
        booking_id: String(bookingId), tutor_id: offer.tutor_id, student_id: user.id,
      },
    });
    await db.from('education_bookings').update({ payment_ref: session.id }).eq('id', bookingId);
    return json({ ok: true, booking_id: bookingId, gateway: 'stripe', checkout_url: session.url });
  } catch (e) {
    console.error('[education-create-booking] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
