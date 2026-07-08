// church-buy-event-ticket: Public endpoint that reserves a seat for a church
// event. Free events → immediately confirmed. Paid events → creates a Stripe
// (EUR/USD/GBP/CAD) or GeniusPay (XOF/XAF) checkout and stores a pending
// ticket that the corresponding webhook flips to 'confirmed'.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const GP_BASE = 'https://geniuspay.ci/api/v1/merchant';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
function form(o: Record<string, string>) { return new URLSearchParams(o).toString(); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE = Deno.env.get('STRIPE_SECRET_KEY');
  const GP_KEY = Deno.env.get('GENIUSPAY_API_KEY');
  const GP_SECRET = Deno.env.get('GENIUSPAY_API_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const b = await req.json();
    const eventId = String(b.event_id || '');
    const buyerName = String(b.buyer_name || '').trim();
    const buyerEmail = b.buyer_email ? String(b.buyer_email).trim() : '';
    const buyerPhone = b.buyer_phone ? String(b.buyer_phone).slice(0, 40) : null;
    const buyerUserId = b.buyer_user_id ? String(b.buyer_user_id) : null;
    const qty = Math.max(1, Math.min(10, Number(b.qty) || 1));
    const gatewayPref = String(b.gateway || '').toLowerCase();
    const returnOrigin = String(b.return_origin || req.headers.get('origin') || 'https://siteviral.com').replace(/\/$/, '');

    if (!eventId) return json({ error: 'event_id required' }, 400);
    if (!buyerName) return json({ error: 'buyer_name required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE);
    const { data: event } = await db
      .from('church_events')
      .select('*, church:church_providers!inner(id, slug, name, status)')
      .eq('id', eventId)
      .maybeSingle();
    if (!event) return json({ error: 'Event not found' }, 404);
    if (event.status !== 'published') return json({ error: 'Event not available' }, 403);
    if ((event as any).church.status === 'suspended') return json({ error: 'Church not accepting registrations' }, 403);

    const priceCents = Number(event.price_cents || 0);
    const currency = String(event.currency || 'XAF').toUpperCase();
    const paid = priceCents > 0;
    const totalCents = priceCents * qty;
    const soldOut = event.capacity && (Number(event.tickets_sold || 0) + qty) > Number(event.capacity);
    if (soldOut) return json({ error: 'Not enough seats available' }, 409);

    if (paid && !/@/.test(buyerEmail)) return json({ error: 'Valid email required for paid events' }, 400);

    const reference = `EVT-${crypto.randomUUID()}`;

    // Insert ticket (pending for paid, confirmed for free)
    const { data: ticket, error: insErr } = await db
      .from('church_event_tickets')
      .insert({
        event_id: event.id,
        church_id: event.church_id,
        buyer_user_id: buyerUserId,
        buyer_name: buyerName,
        buyer_email: buyerEmail || null,
        buyer_phone: buyerPhone,
        qty,
        amount_cents: totalCents,
        currency,
        status: paid ? 'pending' : 'confirmed',
        payment_provider: paid ? null : 'free',
        payment_ref: reference,
      })
      .select()
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    if (!paid) {
      await db.from('church_events').update({
        tickets_sold: Number(event.tickets_sold || 0) + qty,
      }).eq('id', event.id);
      return json({
        ok: true, free: true, ticket, reference,
        redirect_url: `${returnOrigin}/church/${(event as any).church.slug}/events/${event.id}?ticket=${ticket.id}`,
      });
    }

    // Paid: pick gateway
    const isAfrican = currency === 'XOF' || currency === 'XAF';
    const gateway: 'stripe' | 'geniuspay' =
      gatewayPref === 'stripe' ? 'stripe'
      : gatewayPref === 'geniuspay' ? 'geniuspay'
      : isAfrican ? 'geniuspay' : 'stripe';

    const description = `${event.title} × ${qty}`.slice(0, 120);
    const successUrl = `${returnOrigin}/church/${(event as any).church.slug}/events/${event.id}?reference=${reference}&status=success`;
    const cancelUrl = `${returnOrigin}/church/${(event as any).church.slug}/events/${event.id}?reference=${reference}&status=canceled`;

    await db.from('church_event_tickets')
      .update({ payment_provider: gateway })
      .eq('id', ticket.id);

    if (gateway === 'stripe') {
      if (!STRIPE) return json({ error: 'Stripe not configured' }, 500);
      const zeroDecimal = new Set(['JPY', 'XAF', 'XOF']);
      const unitAmount = zeroDecimal.has(currency)
        ? Math.round(totalCents / 100) // stored as "cents" of a zero-decimal ccy → whole units
        : totalCents;
      const params: Record<string, string> = {
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: buyerEmail,
        client_reference_id: reference,
        'line_items[0][price_data][currency]': currency.toLowerCase(),
        'line_items[0][price_data][product_data][name]': description,
        'line_items[0][price_data][unit_amount]': String(unitAmount),
        'line_items[0][quantity]': '1',
        'payment_intent_data[metadata][type]': 'church_event_ticket',
        'payment_intent_data[metadata][sv_reference]': reference,
        'payment_intent_data[metadata][ticket_id]': ticket.id,
        'payment_intent_data[metadata][event_id]': event.id,
        'payment_intent_data[metadata][church_id]': event.church_id,
        'payment_intent_data[metadata][buyer_email]': buyerEmail,
        'metadata[type]': 'church_event_ticket',
        'metadata[sv_reference]': reference,
        'metadata[ticket_id]': ticket.id,
      };
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${STRIPE}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form(params),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        await db.from('church_event_tickets').update({ status: 'failed' }).eq('id', ticket.id);
        return json({ error: data?.error?.message || 'Stripe init failed' }, 502);
      }
      return json({ ok: true, checkout_url: data.url, reference, gateway, ticket });
    } else {
      if (!GP_KEY || !GP_SECRET) return json({ error: 'GeniusPay not configured' }, 500);
      const gpCurrency = currency === 'XAF' ? 'XOF' : currency;
      const amountUnits = Math.round(totalCents / 100); // XAF/XOF: whole units
      const payload = {
        amount: amountUnits,
        currency: gpCurrency,
        description,
        customer: { name: buyerName, email: buyerEmail || undefined, phone: buyerPhone || undefined },
        success_url: successUrl,
        error_url: cancelUrl,
        metadata: {
          type: 'church_event_ticket',
          ticket_id: ticket.id,
          event_id: event.id,
          church_id: event.church_id,
          reference,
          buyer_email: buyerEmail,
        },
      };
      const res = await fetch(`${GP_BASE}/payments`, {
        method: 'POST',
        headers: { 'X-API-Key': GP_KEY, 'X-API-Secret': GP_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.checkout_url) {
        await db.from('church_event_tickets').update({ status: 'failed' }).eq('id', ticket.id);
        return json({ error: data?.error?.message || 'GeniusPay init failed' }, 502);
      }
      return json({ ok: true, checkout_url: data.data.checkout_url, reference, gateway, ticket });
    }
  } catch (e: any) {
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
