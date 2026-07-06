// church-buy-sermon-pdf: Public endpoint that starts a purchase for a published
// sermon PDF. Uses Stripe for EUR/USD/GBP/CAD, GeniusPay for XOF/XAF.
// For free PDFs, immediately marks purchase 'succeeded' and returns download reference.
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
    const pdfId = String(b.pdf_id || '');
    const buyerEmail = String(b.buyer_email || '').trim();
    const buyerName = b.buyer_name ? String(b.buyer_name).slice(0, 120) : null;
    const buyerPhone = b.buyer_phone ? String(b.buyer_phone).slice(0, 40) : null;
    const gatewayPref = String(b.gateway || '').toLowerCase();
    const returnOrigin = String(b.return_origin || req.headers.get('origin') || 'https://siteviral.com').replace(/\/$/, '');

    if (!pdfId) return json({ error: 'pdf_id required' }, 400);
    if (!buyerEmail || !/@/.test(buyerEmail)) return json({ error: 'Valid email required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE);
    const { data: pdf } = await db
      .from('church_sermon_pdfs')
      .select('*, church:church_providers!inner(id, slug, name, status)')
      .eq('id', pdfId)
      .maybeSingle();
    if (!pdf) return json({ error: 'PDF not found' }, 404);
    if (!pdf.is_published) return json({ error: 'PDF not available' }, 403);
    if ((pdf as any).church.status === 'suspended') return json({ error: 'Church not accepting purchases' }, 403);

    const reference = `SPDF-${crypto.randomUUID()}`;
    const amount = Number(pdf.price || 0);
    const currency = String(pdf.currency || 'USD').toUpperCase();
    const isFree = pdf.is_free || amount <= 0;

    if (isFree) {
      const { error: insErr } = await db.from('church_sermon_pdf_purchases').insert({
        pdf_id: pdf.id, church_id: pdf.church_id,
        buyer_email: buyerEmail, buyer_name: buyerName,
        amount: 0, currency, gateway: 'free', reference,
        status: 'succeeded', completed_at: new Date().toISOString(),
      });
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ ok: true, free: true, reference, redirect_url: `${returnOrigin}/church/${(pdf as any).church.slug}/pdf/${pdf.id}/success?reference=${reference}` });
    }

    // Auto-pick gateway if not forced
    const isAfrican = currency === 'XOF' || currency === 'XAF';
    const gateway: 'stripe' | 'geniuspay' =
      gatewayPref === 'stripe' ? 'stripe'
      : gatewayPref === 'geniuspay' ? 'geniuspay'
      : isAfrican ? 'geniuspay' : 'stripe';

    // Insert pending purchase
    const { error: insErr } = await db.from('church_sermon_pdf_purchases').insert({
      pdf_id: pdf.id, church_id: pdf.church_id,
      buyer_email: buyerEmail, buyer_name: buyerName,
      amount, currency, gateway, reference,
      status: 'pending',
      metadata: { source: 'church-buy-sermon-pdf', buyer_phone: buyerPhone },
    });
    if (insErr) return json({ error: insErr.message }, 500);

    const description = `${pdf.title}`.slice(0, 120);
    const successUrl = `${returnOrigin}/church/${(pdf as any).church.slug}/pdf/${pdf.id}/success?reference=${reference}`;
    const cancelUrl = `${returnOrigin}/church/${(pdf as any).church.slug}/pdf/${pdf.id}?status=canceled`;

    if (gateway === 'stripe') {
      if (!STRIPE) return json({ error: 'Stripe not configured' }, 500);
      const zeroDecimal = new Set(['JPY']);
      const unitAmount = zeroDecimal.has(currency) ? Math.round(amount) : Math.round(amount * 100);
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
        'payment_intent_data[metadata][type]': 'church_sermon_pdf',
        'payment_intent_data[metadata][sv_reference]': reference,
        'payment_intent_data[metadata][pdf_id]': pdf.id,
        'payment_intent_data[metadata][church_id]': pdf.church_id,
        'payment_intent_data[metadata][buyer_email]': buyerEmail,
        'metadata[type]': 'church_sermon_pdf',
        'metadata[sv_reference]': reference,
        'metadata[pdf_id]': pdf.id,
      };
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${STRIPE}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form(params),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        await db.from('church_sermon_pdf_purchases').update({ status: 'failed', metadata: { error: data?.error?.message } }).eq('reference', reference);
        return json({ error: data?.error?.message || 'Stripe init failed' }, 502);
      }
      return json({ ok: true, checkout_url: data.url, reference, gateway });
    } else {
      if (!GP_KEY || !GP_SECRET) return json({ error: 'GeniusPay not configured' }, 500);
      const gpCurrency = currency === 'XAF' ? 'XOF' : currency;
      const payload = {
        amount: Math.round(amount),
        currency: gpCurrency,
        description,
        customer: { name: buyerName || undefined, email: buyerEmail, phone: buyerPhone || undefined },
        success_url: successUrl,
        error_url: cancelUrl,
        metadata: {
          type: 'church_sermon_pdf', pdf_id: pdf.id, church_id: pdf.church_id,
          reference, buyer_email: buyerEmail,
        },
      };
      const res = await fetch(`${GP_BASE}/payments`, {
        method: 'POST',
        headers: { 'X-API-Key': GP_KEY, 'X-API-Secret': GP_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.checkout_url) {
        await db.from('church_sermon_pdf_purchases').update({ status: 'failed', metadata: { error: data?.error?.message } }).eq('reference', reference);
        return json({ error: data?.error?.message || 'GeniusPay init failed' }, 502);
      }
      await db.from('church_sermon_pdf_purchases').update({
        metadata: { source: 'church-buy-sermon-pdf', gp_reference: data.data.reference, buyer_phone: buyerPhone },
      }).eq('reference', reference);
      return json({ ok: true, checkout_url: data.data.checkout_url, reference, gateway });
    }
  } catch (e: any) {
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
