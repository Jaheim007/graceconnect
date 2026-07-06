// education-extra-charge: tutor requests mid-session surcharge, student accepts/declines.
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
      const { booking_id, amount, label, reason } = body;
      if (!booking_id || !amount || !label) return json({ error: 'booking_id, amount, label required' }, 400);
      if (Number(amount) < 100) return json({ error: 'Amount too small' }, 400);
      const { data: bk } = await db.from('education_bookings')
        .select('id, tutor_id, student_id, status, started_at').eq('id', booking_id).maybeSingle();
      if (!bk) return json({ error: 'Booking not found' }, 404);
      if (!bk.started_at || bk.status !== 'in_progress') return json({ error: 'Session not started' }, 400);
      const { data: tutor } = await db.from('education_tutors').select('id, user_id').eq('id', bk.tutor_id).maybeSingle();
      if (!tutor || tutor.user_id !== user.id) return json({ error: 'Only tutor can request' }, 403);

      const { data: charge, error } = await db.from('education_extra_charges').insert({
        booking_id: bk.id, tutor_id: bk.tutor_id, student_id: bk.student_id,
        label: String(label).trim().slice(0, 80),
        reason: reason ? String(reason).trim().slice(0, 300) : null,
        amount_xof: Math.round(Number(amount)),
        status: 'pending',
      }).select('*').single();
      if (error || !charge) return json({ error: error?.message || 'insert failed' }, 500);
      return json({ ok: true, extra_charge: charge });
    }

    if (action === 'decline') {
      const { extra_charge_id } = body;
      const { data: ec } = await db.from('education_extra_charges').select('*').eq('id', extra_charge_id).maybeSingle();
      if (!ec) return json({ error: 'Not found' }, 404);
      if (ec.student_id !== user.id) return json({ error: 'Only student can decline' }, 403);
      if (ec.status !== 'pending') return json({ ok: true, already: true });
      await db.from('education_extra_charges').update({
        status: 'rejected', rejected_at: new Date().toISOString(),
      }).eq('id', extra_charge_id);
      return json({ ok: true, status: 'rejected' });
    }

    if (action === 'accept') {
      const { extra_charge_id, return_origin } = body;
      const { data: ec } = await db.from('education_extra_charges').select('*').eq('id', extra_charge_id).maybeSingle();
      if (!ec) return json({ error: 'Not found' }, 404);
      if (ec.student_id !== user.id) return json({ error: 'Only student can accept' }, 403);
      if (ec.status !== 'pending') return json({ error: 'Already resolved' }, 400);

      const origin = req.headers.get('origin') || return_origin || 'https://siteviral.com';
      const base = origin.replace(/\/$/, '');
      const successUrl = `${base}/education/booking/${ec.booking_id}?extra=success`;
      const cancelUrl = `${base}/education/booking/${ec.booking_id}?extra=cancelled`;
      const currency = 'XOF';
      const amount = Number(ec.amount_xof);

      if (AFRICA_MOMO_CURRENCIES.has(currency)) {
        if (!GP_KEY || !GP_SECRET) return json({ error: 'GeniusPay not configured' }, 500);
        const gpRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
          method: 'POST',
          headers: { 'X-API-Key': GP_KEY, 'X-API-Secret': GP_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(amount), currency,
            description: `Supplément Education — ${ec.label}`.slice(0, 120),
            customer: { email: user.email, name: (user.user_metadata as any)?.full_name },
            success_url: successUrl, error_url: cancelUrl,
            metadata: { type: 'education_extra_charge', extra_charge_id: ec.id, booking_id: ec.booking_id, student_id: user.id },
          }),
        });
        const gp = await gpRes.json();
        if (!gpRes.ok || !gp?.success || !gp?.data?.checkout_url) {
          console.error('[education-extra-charge] geniuspay fail', gpRes.status, gp);
          return json({ error: 'Payment provider error' }, 502);
        }
        await db.from('education_extra_charges').update({
          payment_ref: gp.data.reference, approved_at: new Date().toISOString(),
        }).eq('id', ec.id);
        return json({ ok: true, checkout_url: gp.data.checkout_url, gateway: 'geniuspay' });
      }

      if (!STRIPE_KEY) return json({ error: 'Stripe not configured' }, 500);
      const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2025-08-27.basil' as any });
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email ?? undefined,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'xof', unit_amount: Math.round(amount),
            product_data: { name: `Supplément Education — ${ec.label}`.slice(0, 120) },
          },
        }],
        mode: 'payment',
        success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: { type: 'education_extra_charge', extra_charge_id: ec.id, booking_id: ec.booking_id, student_id: user.id },
      });
      await db.from('education_extra_charges').update({
        payment_ref: session.id, approved_at: new Date().toISOString(),
      }).eq('id', ec.id);
      return json({ ok: true, checkout_url: session.url, gateway: 'stripe' });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    console.error('[education-extra-charge] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
