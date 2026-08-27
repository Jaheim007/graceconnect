// Server-only booking creation + payment verification for the Beauty / Home /
// Events / Education verticals. Ported 1:1 from the `*-create-booking` and
// `*-verify-booking` edge functions.

import {
  AFRICA_MOMO_CURRENCIES,
  adminDb,
  baseOrigin,
  geniusPayCheckout,
  getAuthUser,
  stripeCheckout,
  stripeRetrieveSession,
  ZERO_DECIMAL,
} from './payments.server';

const COMMISSION_PCT = 10;

export interface CreateBookingInput {
  offer_id?: string;
  service_id?: string;
  slot_start?: string;
  slot_end?: string;
  location_type?: string;
  address?: string | null;
  notes?: string | null;
  scheduled_at?: string;
  mode?: string;
  location_address?: string | null;
  meeting_url?: string | null;
  return_origin?: string;
}

export interface VerifyBookingInput {
  booking_id: string;
  session_id?: string;
}

export type BookingResult =
  | { ok: true; booking_id: string; gateway: 'stripe' | 'geniuspay'; checkout_url: string }
  | { error: string };

export type VerifyResult =
  | { ok: true; status: string; already?: boolean; gateway?: string }
  | { ok: false; status: string; payment_status?: string }
  | { error: string };

/* ──────────────────────────────── Beauty ──────────────────────────────── */

export async function createBeautyBooking(
  input: CreateBookingInput,
  userId: string,
): Promise<BookingResult> {
  const { service_id, slot_start, slot_end, location_type, address } = input;
  if (!service_id || !slot_start || !slot_end) {
    return { error: 'service_id, slot_start, slot_end required' };
  }
  if (!['salon', 'home'].includes(String(location_type))) {
    return { error: 'invalid location_type' };
  }

  const db = await adminDb();
  const user = await getAuthUser(db, userId);

  const { data: service } = await db
    .from('beauty_services')
    .select('id, provider_id, title, price_amount, price_xof, currency, duration_min, active')
    .eq('id', service_id)
    .maybeSingle();
  if (!service || !service.active) return { error: 'Service unavailable' };

  const { data: provider } = await db
    .from('beauty_providers')
    .select('id, user_id, status, business_name, city')
    .eq('id', service.provider_id)
    .maybeSingle();
  if (!provider || provider.status !== 'active') return { error: 'Provider not available' };
  if (provider.user_id === userId) return { error: 'Cannot book your own service' };

  const currency = String(service.currency || 'XOF').toUpperCase();
  const amount = Number(service.price_amount ?? service.price_xof ?? 0);
  if (!amount || amount < 100) return { error: 'Invalid price' };

  const { data: conflict } = await db
    .from('beauty_bookings')
    .select('id')
    .eq('provider_id', provider.id)
    .not('status', 'in', '(cancelled,refunded,expired)')
    .lt('slot_start', slot_end)
    .gt('slot_end', slot_start)
    .limit(1)
    .maybeSingle();
  if (conflict) return { error: 'Slot no longer available' };

  const commission = Math.round((amount * COMMISSION_PCT) / 100);

  const { data: booking, error: insErr } = await db
    .from('beauty_bookings')
    .insert({
      service_id: service.id,
      provider_id: provider.id,
      client_id: userId,
      slot_start,
      slot_end,
      location_type,
      address: address ?? null,
      mode: 'escrow',
      currency,
      price_amount: amount,
      commission_amount: commission,
      price_xof: currency === 'XOF' ? amount : 0,
      commission_xof: currency === 'XOF' ? commission : 0,
      status: 'pending_payment',
    })
    .select('id')
    .single();
  if (insErr || !booking) {
    console.error('[beauty-create-booking] insert failed', insErr);
    return { error: 'Booking creation failed' };
  }

  const base = baseOrigin(input.return_origin);
  const successUrl = `${base}/beauty/bookings/${booking.id}?status=success`;
  const cancelUrl = `${base}/beauty/bookings/${booking.id}?status=cancelled`;
  const metadata = {
    type: 'beauty_booking',
    booking_id: String(booking.id),
    provider_id: String(provider.id),
    client_id: userId,
  };

  if (AFRICA_MOMO_CURRENCIES.has(currency)) {
    const gp = await geniusPayCheckout({
      amount,
      currency,
      description: `Réservation — ${service.title}`,
      email: user?.email,
      name: user?.user_metadata?.['full_name'],
      successUrl,
      cancelUrl,
      metadata,
      tag: 'beauty-create-booking',
    });
    if ('error' in gp) {
      await db.from('beauty_bookings').delete().eq('id', booking.id);
      return { error: gp.error };
    }
    await db
      .from('beauty_bookings')
      .update({ payment_intent_id: gp.reference, gateway: 'geniuspay' })
      .eq('id', booking.id);
    return { ok: true, booking_id: booking.id, gateway: 'geniuspay', checkout_url: gp.checkout_url };
  }

  const st = await stripeCheckout({
    amount,
    currency,
    productName: `${service.title} — ${provider.business_name}`,
    productDescription: `Réservation ${new Date(slot_start).toLocaleString('fr-FR')}`,
    email: user?.email,
    successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl,
    metadata,
    tag: 'beauty-create-booking',
  });
  if ('error' in st) return { error: st.error };
  await db
    .from('beauty_bookings')
    .update({ payment_intent_id: st.id, gateway: 'stripe' })
    .eq('id', booking.id);
  return { ok: true, booking_id: booking.id, gateway: 'stripe', checkout_url: st.checkout_url };
}

export async function verifyBeautyBooking(input: VerifyBookingInput): Promise<VerifyResult> {
  const db = await adminDb();
  const { data: booking } = await db
    .from('beauty_bookings')
    .select('id, status, gateway, payment_intent_id, slot_end')
    .eq('id', input.booking_id)
    .maybeSingle();
  if (!booking) return { error: 'Booking not found' };
  if (booking.status !== 'pending_payment') {
    return { ok: true, status: booking.status, already: true };
  }
  if (booking.gateway !== 'stripe') {
    return { ok: true, status: booking.status, gateway: booking.gateway };
  }

  const sid = input.session_id || booking.payment_intent_id;
  if (!sid) return { ok: false, status: booking.status };
  const session = await stripeRetrieveSession(sid, 'beauty-verify-booking');
  if ('error' in session) return { error: session.error };
  if (session.payment_status !== 'paid') {
    return { ok: false, status: booking.status, payment_status: session.payment_status };
  }

  const autoRelease = new Date(
    new Date(booking.slot_end).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();
  await db
    .from('beauty_bookings')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      auto_release_at: autoRelease,
    })
    .eq('id', input.booking_id);
  await db.from('beauty_booking_events').insert({
    booking_id: input.booking_id,
    event_type: 'payment_confirmed',
    payload: { gateway: 'stripe', session_id: sid },
  });
  return { ok: true, status: 'confirmed' };
}

/* ───────────────────────────────── Home ───────────────────────────────── */

export async function createHomeBooking(
  input: CreateBookingInput,
  userId: string,
): Promise<BookingResult> {
  if (!input.offer_id) return { error: 'offer_id required' };
  const db = await adminDb();
  const user = await getAuthUser(db, userId);

  const { data: offer } = await db
    .from('home_offers')
    .select(
      'id, conversation_id, provider_id, client_id, title, description, price, currency, scheduled_for, address, status',
    )
    .eq('id', input.offer_id)
    .maybeSingle();
  if (!offer) return { error: 'Offer not found' };
  if (offer.client_id !== userId) return { error: 'Only client can accept' };
  if (!['sent', 'draft'].includes(offer.status)) return { error: 'Offer no longer available' };

  const { data: provider } = await db
    .from('home_providers')
    .select('id, user_id, status, business_name')
    .eq('id', offer.provider_id)
    .maybeSingle();
  if (!provider || provider.status !== 'active') return { error: 'Provider not available' };

  const currency = String(offer.currency || 'XOF').toUpperCase();
  const amount = Number(offer.price);
  if (!amount || amount < 100) return { error: 'Invalid price' };
  const commission = Math.round((amount * COMMISSION_PCT) / 100);

  const { data: existing } = await db
    .from('home_bookings')
    .select('id, status, gateway, payment_intent_id')
    .eq('offer_id', offer.id)
    .maybeSingle();

  let bookingId = existing?.id as string | undefined;
  if (!existing) {
    const { data: inserted, error: insErr } = await db
      .from('home_bookings')
      .insert({
        offer_id: offer.id,
        provider_id: offer.provider_id,
        client_id: offer.client_id,
        address: offer.address,
        scheduled_for: offer.scheduled_for,
        price: amount,
        commission,
        currency,
        status: 'pending_payment',
      })
      .select('id')
      .single();
    if (insErr || !inserted) {
      console.error('[home-create-booking] insert failed', insErr);
      return { error: 'Booking creation failed' };
    }
    bookingId = inserted.id;
  } else if (existing.status !== 'pending_payment') {
    return { error: 'Booking already ' + existing.status };
  }

  const base = baseOrigin(input.return_origin);
  const successUrl = `${base}/home/booking/${bookingId}?status=success`;
  const cancelUrl = `${base}/home/booking/${bookingId}?status=cancelled`;
  const metadata = {
    type: 'home_booking',
    booking_id: String(bookingId),
    provider_id: String(offer.provider_id),
    client_id: userId,
  };

  if (AFRICA_MOMO_CURRENCIES.has(currency)) {
    const gp = await geniusPayCheckout({
      amount,
      currency,
      description: `SiteViral Home — ${offer.title}`,
      email: user?.email,
      name: user?.user_metadata?.['full_name'],
      successUrl,
      cancelUrl,
      metadata,
      tag: 'home-create-booking',
    });
    if ('error' in gp) return { error: gp.error };
    await db
      .from('home_bookings')
      .update({ gateway: 'geniuspay', payment_intent_id: gp.reference })
      .eq('id', bookingId);
    return { ok: true, booking_id: bookingId!, gateway: 'geniuspay', checkout_url: gp.checkout_url };
  }

  const st = await stripeCheckout({
    amount,
    currency,
    productName: `${offer.title} — ${provider.business_name}`,
    productDescription: offer.description || undefined,
    email: user?.email,
    successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl,
    metadata,
    tag: 'home-create-booking',
  });
  if ('error' in st) return { error: st.error };
  await db
    .from('home_bookings')
    .update({ gateway: 'stripe', payment_intent_id: st.id })
    .eq('id', bookingId);
  return { ok: true, booking_id: bookingId!, gateway: 'stripe', checkout_url: st.checkout_url };
}

export async function verifyHomeBooking(input: VerifyBookingInput): Promise<VerifyResult> {
  const db = await adminDb();
  const { data: booking } = await db
    .from('home_bookings')
    .select('id, status, gateway, payment_intent_id, scheduled_for, offer_id')
    .eq('id', input.booking_id)
    .maybeSingle();
  if (!booking) return { error: 'Booking not found' };
  if (booking.status !== 'pending_payment') {
    return { ok: true, status: booking.status, already: true };
  }
  if (booking.gateway !== 'stripe') {
    return { ok: true, status: booking.status, gateway: booking.gateway };
  }

  const sid = input.session_id || booking.payment_intent_id;
  if (!sid) return { ok: false, status: booking.status };
  const session = await stripeRetrieveSession(sid, 'home-verify-booking');
  if ('error' in session) return { error: session.error };
  if (session.payment_status !== 'paid') {
    return { ok: false, status: booking.status, payment_status: session.payment_status };
  }

  const baseline = booking.scheduled_for ? new Date(booking.scheduled_for) : new Date();
  const autoRelease = new Date(baseline.getTime() + 48 * 60 * 60 * 1000).toISOString();
  await db
    .from('home_bookings')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      auto_release_at: autoRelease,
      escrow_status: 'held',
    })
    .eq('id', input.booking_id);
  if (booking.offer_id) {
    await db.from('home_offers').update({ status: 'accepted' }).eq('id', booking.offer_id);
  }
  await db.from('home_booking_events').insert({
    booking_id: input.booking_id,
    kind: 'payment_confirmed',
    meta: { gateway: 'stripe', session_id: sid },
  });
  return { ok: true, status: 'confirmed' };
}

/* ──────────────────────────────── Events ──────────────────────────────── */

export async function createEventsBooking(
  input: CreateBookingInput,
  userId: string,
): Promise<BookingResult> {
  if (!input.offer_id) return { error: 'offer_id required' };
  const db = await adminDb();
  const user = await getAuthUser(db, userId);

  const { data: offer } = await db
    .from('events_offers')
    .select(
      'id, conversation_id, provider_id, client_id, title, description, price, currency, deposit_amount, event_date, venue_address, guest_count, status',
    )
    .eq('id', input.offer_id)
    .maybeSingle();
  if (!offer) return { error: 'Offer not found' };
  if (offer.client_id !== userId) return { error: 'Only client can accept' };
  if (!['sent', 'draft'].includes(offer.status)) return { error: 'Offer no longer available' };

  const { data: provider } = await db
    .from('events_providers')
    .select('id, user_id, status, business_name')
    .eq('id', offer.provider_id)
    .maybeSingle();
  if (!provider || provider.status !== 'active') return { error: 'Provider not available' };

  const currency = String(offer.currency || 'XOF').toUpperCase();
  const totalPrice = Number(offer.price);
  const chargeNow = offer.deposit_amount ? Number(offer.deposit_amount) : totalPrice;
  if (!chargeNow || chargeNow < 100) return { error: 'Invalid amount' };
  const balanceDue = Math.max(0, totalPrice - chargeNow);
  const commission = Math.round((totalPrice * COMMISSION_PCT) / 100);

  const { data: existing } = await db
    .from('events_bookings')
    .select('id, status, gateway, payment_intent_id')
    .eq('offer_id', offer.id)
    .maybeSingle();

  let bookingId = existing?.id as string | undefined;
  if (!existing) {
    const { data: inserted, error: insErr } = await db
      .from('events_bookings')
      .insert({
        offer_id: offer.id,
        provider_id: offer.provider_id,
        client_id: offer.client_id,
        venue_address: offer.venue_address,
        event_date: offer.event_date,
        guest_count: offer.guest_count,
        price: totalPrice,
        deposit_paid: 0,
        balance_due: balanceDue,
        commission,
        currency,
        status: 'pending_payment',
      })
      .select('id')
      .single();
    if (insErr || !inserted) {
      console.error('[events-create-booking] insert failed', insErr);
      return { error: 'Booking creation failed' };
    }
    bookingId = inserted.id;
  } else if (existing.status !== 'pending_payment') {
    return { error: 'Booking already ' + existing.status };
  }

  const base = baseOrigin(input.return_origin);
  const successUrl = `${base}/events/booking/${bookingId}?status=success`;
  const cancelUrl = `${base}/events/booking/${bookingId}?status=cancelled`;
  const isDeposit = chargeNow < totalPrice;

  if (AFRICA_MOMO_CURRENCIES.has(currency)) {
    const gp = await geniusPayCheckout({
      amount: chargeNow,
      currency,
      description: `SiteViral Events — ${offer.title}${isDeposit ? ' (acompte)' : ''}`,
      email: user?.email,
      name: user?.user_metadata?.['full_name'],
      successUrl,
      cancelUrl,
      metadata: {
        type: 'events_booking',
        booking_id: bookingId,
        provider_id: offer.provider_id,
        client_id: userId,
        is_deposit: isDeposit,
        deposit_amount: chargeNow,
      },
      tag: 'events-create-booking',
    });
    if ('error' in gp) return { error: gp.error };
    await db
      .from('events_bookings')
      .update({ gateway: 'geniuspay', payment_intent_id: gp.reference })
      .eq('id', bookingId);
    return { ok: true, booking_id: bookingId!, gateway: 'geniuspay', checkout_url: gp.checkout_url };
  }

  const st = await stripeCheckout({
    amount: chargeNow,
    currency,
    productName: `${offer.title}${isDeposit ? ' — Acompte' : ''} — ${provider.business_name}`,
    productDescription: offer.description || undefined,
    email: user?.email,
    successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl,
    metadata: {
      type: 'events_booking',
      booking_id: String(bookingId),
      provider_id: String(offer.provider_id),
      client_id: userId,
      is_deposit: String(isDeposit),
      deposit_amount: String(chargeNow),
    },
    tag: 'events-create-booking',
  });
  if ('error' in st) return { error: st.error };
  await db
    .from('events_bookings')
    .update({ gateway: 'stripe', payment_intent_id: st.id })
    .eq('id', bookingId);
  return { ok: true, booking_id: bookingId!, gateway: 'stripe', checkout_url: st.checkout_url };
}

export async function verifyEventsBooking(input: VerifyBookingInput): Promise<VerifyResult> {
  const db = await adminDb();
  const { data: booking } = await db
    .from('events_bookings')
    .select('id, status, gateway, payment_intent_id, event_date, offer_id, price, balance_due')
    .eq('id', input.booking_id)
    .maybeSingle();
  if (!booking) return { error: 'Booking not found' };
  if (booking.status !== 'pending_payment') {
    return { ok: true, status: booking.status, already: true };
  }
  if (booking.gateway !== 'stripe') {
    return { ok: true, status: booking.status, gateway: booking.gateway };
  }

  const sid = input.session_id || booking.payment_intent_id;
  if (!sid) return { ok: false, status: booking.status };
  const session = await stripeRetrieveSession(sid, 'events-verify-booking');
  if ('error' in session) return { error: session.error };
  if (session.payment_status !== 'paid') {
    return { ok: false, status: booking.status, payment_status: session.payment_status };
  }

  const isDeposit = Number(booking.balance_due) > 0;
  const baseline = booking.event_date ? new Date(booking.event_date) : new Date();
  const autoRelease = new Date(baseline.getTime() + 48 * 60 * 60 * 1000).toISOString();
  const divisor = ZERO_DECIMAL.includes(String(session.currency || '').toUpperCase()) ? 1 : 100;
  const amountPaid = Number(session.amount_total ?? 0) / divisor;
  await db
    .from('events_bookings')
    .update({
      status: isDeposit ? 'deposit_paid' : 'confirmed',
      confirmed_at: new Date().toISOString(),
      auto_release_at: autoRelease,
      escrow_status: 'held',
      deposit_paid: amountPaid || Number(booking.price) - Number(booking.balance_due),
    })
    .eq('id', input.booking_id);
  if (booking.offer_id) {
    await db.from('events_offers').update({ status: 'accepted' }).eq('id', booking.offer_id);
  }
  await db.from('events_booking_events').insert({
    booking_id: input.booking_id,
    kind: 'payment_confirmed',
    meta: { gateway: 'stripe', session_id: sid, is_deposit: isDeposit },
  });
  return { ok: true, status: isDeposit ? 'deposit_paid' : 'confirmed' };
}

/* ─────────────────────────────── Education ────────────────────────────── */

export async function createEducationBooking(
  input: CreateBookingInput,
  userId: string,
): Promise<BookingResult> {
  if (!input.offer_id) return { error: 'offer_id required' };
  if (!input.scheduled_at) return { error: 'scheduled_at required' };
  const db = await adminDb();
  const user = await getAuthUser(db, userId);

  const { data: offer } = await db
    .from('education_offers')
    .select(
      'id, conversation_id, tutor_id, student_id, subject, mode, session_count, duration_min, rate_xof, total_xof, description, status',
    )
    .eq('id', input.offer_id)
    .maybeSingle();
  if (!offer) return { error: 'Offer not found' };
  if (offer.student_id !== userId) return { error: 'Only student can accept' };
  if (offer.status !== 'pending') return { error: 'Offer no longer available' };

  const { data: tutor } = await db
    .from('education_tutors')
    .select('id, user_id, is_active, display_name')
    .eq('id', offer.tutor_id)
    .maybeSingle();
  if (!tutor || !tutor.is_active) return { error: 'Tutor not available' };

  const amount = Number(offer.total_xof);
  if (!amount || amount < 100) return { error: 'Invalid price' };
  const commission = Math.round((amount * COMMISSION_PCT) / 100);
  const currency = 'XOF';

  const { data: existing } = await db
    .from('education_bookings')
    .select('id, status, payment_ref')
    .eq('offer_id', offer.id)
    .maybeSingle();

  let bookingId = existing?.id as string | undefined;
  if (!existing) {
    const { data: inserted, error: insErr } = await db
      .from('education_bookings')
      .insert({
        offer_id: offer.id,
        conversation_id: offer.conversation_id,
        tutor_id: offer.tutor_id,
        student_id: offer.student_id,
        subject: offer.subject,
        mode: input.mode || offer.mode,
        scheduled_at: input.scheduled_at,
        duration_min: offer.duration_min,
        session_count: offer.session_count,
        location_address: input.location_address || null,
        meeting_url: input.meeting_url || null,
        total_xof: amount,
        platform_fee_xof: commission,
        tutor_earnings_xof: amount - commission,
        status: 'awaiting_payment',
      })
      .select('id')
      .single();
    if (insErr || !inserted) {
      console.error('[education-create-booking] insert failed', insErr);
      return { error: 'Booking creation failed' };
    }
    bookingId = inserted.id;
  } else if (existing.status !== 'awaiting_payment') {
    return { error: 'Booking already ' + existing.status };
  }

  const base = baseOrigin(input.return_origin);
  const successUrl = `${base}/education/booking/${bookingId}?status=success`;
  const cancelUrl = `${base}/education/booking/${bookingId}?status=cancelled`;

  if (AFRICA_MOMO_CURRENCIES.has(currency)) {
    const gp = await geniusPayCheckout({
      amount,
      currency,
      description: `SiteViral Education — ${offer.subject}`,
      email: user?.email,
      name: user?.user_metadata?.['full_name'],
      successUrl,
      cancelUrl,
      metadata: {
        type: 'education_booking',
        booking_id: bookingId,
        tutor_id: offer.tutor_id,
        student_id: userId,
      },
      tag: 'education-create-booking',
    });
    if ('error' in gp) return { error: gp.error };
    await db.from('education_bookings').update({ payment_ref: gp.reference }).eq('id', bookingId);
    return { ok: true, booking_id: bookingId!, gateway: 'geniuspay', checkout_url: gp.checkout_url };
  }

  const st = await stripeCheckout({
    amount,
    currency,
    productName: `${offer.subject} — ${tutor.display_name}`,
    productDescription: offer.description || undefined,
    email: user?.email,
    successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl,
    metadata: {
      type: 'education_booking',
      booking_id: String(bookingId),
      tutor_id: String(offer.tutor_id),
      student_id: userId,
    },
    tag: 'education-create-booking',
  });
  if ('error' in st) return { error: st.error };
  await db.from('education_bookings').update({ payment_ref: st.id }).eq('id', bookingId);
  return { ok: true, booking_id: bookingId!, gateway: 'stripe', checkout_url: st.checkout_url };
}

export async function verifyEducationBooking(input: VerifyBookingInput): Promise<VerifyResult> {
  const db = await adminDb();
  const { data: booking } = await db
    .from('education_bookings')
    .select('id, status, payment_ref, payment_status, offer_id')
    .eq('id', input.booking_id)
    .maybeSingle();
  if (!booking) return { error: 'Booking not found' };
  if (booking.status !== 'awaiting_payment') {
    return { ok: true, status: booking.status, already: true };
  }

  const sid = input.session_id || booking.payment_ref;
  if (!sid) return { ok: false, status: booking.status };
  const session = await stripeRetrieveSession(sid, 'education-verify-booking');
  if ('error' in session) return { error: session.error };
  if (session.payment_status !== 'paid') {
    return { ok: false, status: booking.status, payment_status: session.payment_status };
  }

  await db
    .from('education_bookings')
    .update({ status: 'confirmed', payment_status: 'paid' })
    .eq('id', input.booking_id);
  if (booking.offer_id) {
    await db
      .from('education_offers')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', booking.offer_id);
  }
  await db.from('education_booking_events').insert({
    booking_id: input.booking_id,
    event_type: 'payment_confirmed',
    meta: { gateway: 'stripe', session_id: sid },
  });
  return { ok: true, status: 'confirmed' };
}
