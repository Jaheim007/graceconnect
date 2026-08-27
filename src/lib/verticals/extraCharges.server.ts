// Server-only in-service surcharge logic for the Beauty / Home / Events / Education
// verticals. Ported 1:1 from the `*-extra-charge` edge functions.
// Actions: create | accept | decline

const AFRICA_MOMO_CURRENCIES = new Set(['XOF', 'GHS', 'KES']);
const ZERO_DECIMAL = ['XOF', 'XAF', 'JPY', 'KRW', 'VND'];

export type ExtraChargeVertical = 'beauty' | 'home' | 'events' | 'education';

export interface ExtraChargeInput {
  action: string;
  booking_id?: string;
  extra_charge_id?: string;
  amount?: number;
  description?: string;
  label?: string;
  reason?: string;
  return_origin?: string;
}

export type ExtraChargeResult =
  | { ok: true; extra_charge?: unknown; status?: string; already?: boolean }
  | { ok: true; checkout_url: string; gateway: 'stripe' | 'geniuspay' }
  | { error: string };

type AnyDb = { from: (table: string) => any; auth: any };

async function admin(): Promise<AnyDb> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as AnyDb;
}

async function getUser(db: AnyDb, userId: string) {
  const { data } = await db.auth.admin.getUserById(userId);
  return data?.user as { email?: string; user_metadata?: Record<string, unknown> } | undefined;
}

function baseOrigin(returnOrigin?: string) {
  return String(returnOrigin || 'https://siteviral.com').replace(/\/$/, '');
}

async function geniusPayCheckout(args: {
  amount: number;
  currency: string;
  description: string;
  email?: string;
  name?: unknown;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, unknown>;
  tag: string;
}): Promise<{ checkout_url: string; reference: string } | { error: string }> {
  const key = process.env['GENIUSPAY_API_KEY'] || '';
  const secret = process.env['GENIUSPAY_API_SECRET'] || '';
  if (!key || !secret) return { error: 'GeniusPay not configured' };

  const res = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method: 'POST',
    headers: { 'X-API-Key': key, 'X-API-Secret': secret, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(args.amount),
      currency: args.currency,
      description: args.description.slice(0, 120),
      customer: { email: args.email, name: args.name },
      success_url: args.successUrl,
      error_url: args.cancelUrl,
      metadata: args.metadata,
    }),
  });
  const gp = await res.json().catch(() => null);
  if (!res.ok || !gp?.success || !gp?.data?.checkout_url) {
    console.error(`[${args.tag}] geniuspay fail`, res.status, gp);
    return { error: 'Payment provider error' };
  }
  return { checkout_url: gp.data.checkout_url as string, reference: gp.data.reference as string };
}

/** Stripe Checkout session via REST (no Node SDK — Worker friendly). */
async function stripeCheckout(args: {
  amount: number;
  currency: string;
  productName: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  tag: string;
}): Promise<{ checkout_url: string; id: string } | { error: string }> {
  const secret = process.env['STRIPE_SECRET_KEY'] || '';
  if (!secret) return { error: 'Stripe not configured' };

  const currency = args.currency.toUpperCase();
  const unitAmount = ZERO_DECIMAL.includes(currency)
    ? Math.round(args.amount)
    : Math.round(args.amount * 100);

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', args.successUrl);
  form.set('cancel_url', args.cancelUrl);
  if (args.email) form.set('customer_email', args.email);
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', currency.toLowerCase());
  form.set('line_items[0][price_data][unit_amount]', String(unitAmount));
  form.set('line_items[0][price_data][product_data][name]', args.productName.slice(0, 120));
  for (const [k, v] of Object.entries(args.metadata)) form.set(`metadata[${k}]`, String(v));

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const session = await res.json().catch(() => null);
  if (!res.ok || !session?.url) {
    console.error(`[${args.tag}] stripe fail`, res.status, session?.error?.message);
    return { error: session?.error?.message || 'Stripe error' };
  }
  return { checkout_url: session.url as string, id: session.id as string };
}

/* ────────────────────────── Beauty / Home / Events ────────────────────────── */

interface StdConfig {
  vertical: 'beauty' | 'home' | 'events';
  bookings: string;
  providers: string;
  charges: string;
  conversations: string;
  messages: string;
  pendingStatus: 'pending' | 'proposed';
  declinedStatus: 'declined';
  bookingPath: (id: string) => string;
  requireStatus?: (status: string) => boolean;
  notStartedError: string;
  providerError: string;
  metadataType: string;
  tag: string;
}

const STD: Record<'beauty' | 'home' | 'events', StdConfig> = {
  beauty: {
    vertical: 'beauty',
    bookings: 'beauty_bookings',
    providers: 'beauty_providers',
    charges: 'beauty_extra_charges',
    conversations: 'beauty_conversations',
    messages: 'beauty_messages',
    pendingStatus: 'pending',
    declinedStatus: 'declined',
    bookingPath: (id) => `/beauty/bookings/${id}`,
    requireStatus: (s) => s === 'confirmed',
    notStartedError: 'Service not started yet',
    providerError: 'Only the provider can request',
    metadataType: 'beauty_extra_charge',
    tag: 'beauty-extra-charge',
  },
  home: {
    vertical: 'home',
    bookings: 'home_bookings',
    providers: 'home_providers',
    charges: 'home_extra_charges',
    conversations: 'home_conversations',
    messages: 'home_messages',
    pendingStatus: 'proposed',
    declinedStatus: 'declined',
    bookingPath: (id) => `/home/booking/${id}`,
    requireStatus: (s) => s === 'in_progress',
    notStartedError: 'Service not started',
    providerError: 'Only the provider can request',
    metadataType: 'home_extra_charge',
    tag: 'home-extra-charge',
  },
  events: {
    vertical: 'events',
    bookings: 'events_bookings',
    providers: 'events_providers',
    charges: 'events_extra_charges',
    conversations: 'events_conversations',
    messages: 'events_messages',
    pendingStatus: 'proposed',
    declinedStatus: 'declined',
    bookingPath: (id) => `/events/booking/${id}`,
    requireStatus: (s) => s === 'in_progress',
    notStartedError: 'Event not started',
    providerError: 'Only the vendor can request',
    metadataType: 'events_extra_charge',
    tag: 'events-extra-charge',
  },
};

async function runStd(
  cfg: StdConfig,
  input: ExtraChargeInput,
  userId: string,
): Promise<ExtraChargeResult> {
  const db = await admin();
  const action = String(input.action || '');

  if (action === 'create') {
    const { booking_id: bookingId, amount, description } = input;
    if (!bookingId || !amount || !description) {
      return { error: 'booking_id, amount, description required' };
    }
    if (Number(amount) < 100) return { error: 'Amount too small' };
    if (String(description).trim().length < 3) return { error: 'Description too short' };

    const { data: bk } = await db.from(cfg.bookings)
      .select('id, provider_id, client_id, currency, status, started_at')
      .eq('id', bookingId).maybeSingle();
    if (!bk) return { error: 'Booking not found' };
    if (!bk.started_at) return { error: cfg.notStartedError };
    if (cfg.requireStatus && !cfg.requireStatus(String(bk.status))) {
      return { error: cfg.vertical === 'beauty' ? 'Invalid booking status' : cfg.notStartedError };
    }

    const { data: prov } = await db.from(cfg.providers)
      .select('id, user_id').eq('id', bk.provider_id).maybeSingle();
    if (!prov || prov.user_id !== userId) return { error: cfg.providerError };

    const currency = String(bk.currency || 'XOF').toUpperCase();
    const row: Record<string, unknown> = {
      booking_id: bk.id,
      provider_id: bk.provider_id,
      client_id: bk.client_id,
      description: String(description).trim().slice(0, 300),
      amount: Math.round(Number(amount)),
      currency,
      status: cfg.pendingStatus,
    };
    if (cfg.vertical !== 'beauty') row['label'] = String(description).trim().slice(0, 80);

    const { data: charge, error } = await db.from(cfg.charges).insert(row).select('*').single();
    if (error || !charge) return { error: error?.message || 'insert failed' };

    const { data: conv } = await db.from(cfg.conversations)
      .select('id').eq('provider_id', bk.provider_id).eq('client_id', bk.client_id).maybeSingle();
    if (conv) {
      await db.from(cfg.messages).insert({
        conversation_id: conv.id,
        sender_id: userId,
        kind: 'extra_charge',
        extra_charge_id: charge.id,
        body: `Supplément demandé: ${description} — ${amount} ${currency}`,
      });
    }
    return { ok: true, extra_charge: charge };
  }

  if (action === 'decline') {
    const id = input.extra_charge_id;
    const { data: ec } = await db.from(cfg.charges).select('*').eq('id', id).maybeSingle();
    if (!ec) return { error: 'Not found' };
    if (ec.client_id !== userId) return { error: 'Only client can decline' };
    if (ec.status !== cfg.pendingStatus) return { ok: true, already: true };
    await db.from(cfg.charges).update({ status: cfg.declinedStatus }).eq('id', id);
    return { ok: true, status: cfg.declinedStatus };
  }

  if (action === 'accept') {
    const id = input.extra_charge_id;
    const { data: ec } = await db.from(cfg.charges).select('*').eq('id', id).maybeSingle();
    if (!ec) return { error: 'Not found' };
    if (ec.client_id !== userId) return { error: 'Only client can accept' };
    if (ec.status !== cfg.pendingStatus) return { error: 'Already resolved' };
    if (ec.expires_at && new Date(ec.expires_at).getTime() < Date.now()) {
      await db.from(cfg.charges)
        .update({ status: cfg.vertical === 'beauty' ? 'expired' : 'declined' })
        .eq('id', ec.id);
      return { error: 'Request expired' };
    }

    const user = await getUser(db, userId);
    const base = baseOrigin(input.return_origin);
    const successUrl = `${base}${cfg.bookingPath(ec.booking_id)}?extra=success`;
    const cancelUrl = `${base}${cfg.bookingPath(ec.booking_id)}?extra=cancelled`;
    const currency = String(ec.currency || 'XOF').toUpperCase();
    const amount = Number(ec.amount);
    const name = `Supplément — ${ec.description || ec.label}`;
    const metadata = {
      type: cfg.metadataType,
      extra_charge_id: String(ec.id),
      booking_id: String(ec.booking_id),
      client_id: userId,
    };

    if (AFRICA_MOMO_CURRENCIES.has(currency)) {
      const gp = await geniusPayCheckout({
        amount, currency, description: name,
        email: user?.email, name: user?.user_metadata?.['full_name'],
        successUrl, cancelUrl, metadata, tag: cfg.tag,
      });
      if ('error' in gp) return { error: gp.error };
      await db.from(cfg.charges)
        .update({ payment_intent_id: gp.reference, gateway: 'geniuspay' }).eq('id', ec.id);
      return { ok: true, checkout_url: gp.checkout_url, gateway: 'geniuspay' };
    }

    const s = await stripeCheckout({
      amount, currency, productName: name, email: user?.email,
      successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl, metadata, tag: cfg.tag,
    });
    if ('error' in s) return { error: s.error };
    await db.from(cfg.charges)
      .update({ payment_intent_id: s.id, gateway: 'stripe' }).eq('id', ec.id);
    return { ok: true, checkout_url: s.checkout_url, gateway: 'stripe' };
  }

  return { error: 'unknown action' };
}

export const runBeautyExtraCharge = (i: ExtraChargeInput, u: string) => runStd(STD.beauty, i, u);
export const runHomeExtraCharge = (i: ExtraChargeInput, u: string) => runStd(STD.home, i, u);
export const runEventsExtraCharge = (i: ExtraChargeInput, u: string) => runStd(STD.events, i, u);

/* ──────────────────────────────── Education ──────────────────────────────── */

export async function runEducationExtraCharge(
  input: ExtraChargeInput,
  userId: string,
): Promise<ExtraChargeResult> {
  const db = await admin();
  const action = String(input.action || '');
  const TAG = 'education-extra-charge';

  if (action === 'create') {
    const { booking_id: bookingId, amount, label, reason } = input;
    if (!bookingId || !amount || !label) return { error: 'booking_id, amount, label required' };
    if (Number(amount) < 100) return { error: 'Amount too small' };

    const { data: bk } = await db.from('education_bookings')
      .select('id, tutor_id, student_id, status, started_at').eq('id', bookingId).maybeSingle();
    if (!bk) return { error: 'Booking not found' };
    if (!bk.started_at || bk.status !== 'in_progress') return { error: 'Session not started' };

    const { data: tutor } = await db.from('education_tutors')
      .select('id, user_id').eq('id', bk.tutor_id).maybeSingle();
    if (!tutor || tutor.user_id !== userId) return { error: 'Only tutor can request' };

    const { data: charge, error } = await db.from('education_extra_charges').insert({
      booking_id: bk.id,
      tutor_id: bk.tutor_id,
      student_id: bk.student_id,
      label: String(label).trim().slice(0, 80),
      reason: reason ? String(reason).trim().slice(0, 300) : null,
      amount_xof: Math.round(Number(amount)),
      status: 'pending',
    }).select('*').single();
    if (error || !charge) return { error: error?.message || 'insert failed' };
    return { ok: true, extra_charge: charge };
  }

  if (action === 'decline') {
    const id = input.extra_charge_id;
    const { data: ec } = await db.from('education_extra_charges')
      .select('*').eq('id', id).maybeSingle();
    if (!ec) return { error: 'Not found' };
    if (ec.student_id !== userId) return { error: 'Only student can decline' };
    if (ec.status !== 'pending') return { ok: true, already: true };
    await db.from('education_extra_charges')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() }).eq('id', id);
    return { ok: true, status: 'rejected' };
  }

  if (action === 'accept') {
    const id = input.extra_charge_id;
    const { data: ec } = await db.from('education_extra_charges')
      .select('*').eq('id', id).maybeSingle();
    if (!ec) return { error: 'Not found' };
    if (ec.student_id !== userId) return { error: 'Only student can accept' };
    if (ec.status !== 'pending') return { error: 'Already resolved' };

    const user = await getUser(db, userId);
    const base = baseOrigin(input.return_origin);
    const successUrl = `${base}/education/booking/${ec.booking_id}?extra=success`;
    const cancelUrl = `${base}/education/booking/${ec.booking_id}?extra=cancelled`;
    const amount = Number(ec.amount_xof);
    const name = `Supplément Education — ${ec.label}`;
    const metadata = {
      type: 'education_extra_charge',
      extra_charge_id: String(ec.id),
      booking_id: String(ec.booking_id),
      student_id: userId,
    };

    const gp = await geniusPayCheckout({
      amount, currency: 'XOF', description: name,
      email: user?.email, name: user?.user_metadata?.['full_name'],
      successUrl, cancelUrl, metadata, tag: TAG,
    });
    if (!('error' in gp)) {
      await db.from('education_extra_charges').update({
        payment_ref: gp.reference, approved_at: new Date().toISOString(),
      }).eq('id', ec.id);
      return { ok: true, checkout_url: gp.checkout_url, gateway: 'geniuspay' };
    }
    if (gp.error !== 'GeniusPay not configured') return { error: gp.error };

    const s = await stripeCheckout({
      amount, currency: 'XOF', productName: name, email: user?.email,
      successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl, metadata, tag: TAG,
    });
    if ('error' in s) return { error: s.error };
    await db.from('education_extra_charges').update({
      payment_ref: s.id, approved_at: new Date().toISOString(),
    }).eq('id', ec.id);
    return { ok: true, checkout_url: s.checkout_url, gateway: 'stripe' };
  }

  return { error: 'unknown action' };
}
