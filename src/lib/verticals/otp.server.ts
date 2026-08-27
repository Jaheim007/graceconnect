// Server-only dual-OTP logic for the Home / Events / Education verticals.
// Ported 1:1 from the `home-otp`, `events-otp` and `education-otp` edge functions.

type Json = Record<string, unknown>;

export type OtpAction = 'generate_start' | 'verify_start' | 'generate_end' | 'verify_end';

export interface OtpInput {
  action: string;
  booking_id: string;
  code?: string;
}

export type OtpResult =
  | { ok: true; otp?: string; status?: string }
  | { error: string };

function code4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  // The vertical tables are addressed dynamically per vertical.
  return supabaseAdmin as unknown as {
    from: (table: string) => any;
  };
}

/** Home vertical: client issues the start code, provider issues the end code. */
export async function runHomeOtp(input: OtpInput, userId: string): Promise<OtpResult> {
  const db = await admin();
  const { action, booking_id: bookingId } = input;
  const code = input.code ? String(input.code).trim() : undefined;

  const { data: bk } = await db.from('home_bookings')
    .select('id, provider_id, client_id, status, start_otp, end_otp, start_otp_verified_at, end_otp_verified_at')
    .eq('id', bookingId).maybeSingle();
  if (!bk) return { error: 'Booking not found' };

  const { data: prov } = await db.from('home_providers').select('id, user_id').eq('id', bk.provider_id).maybeSingle();
  const isClient = bk.client_id === userId;
  const isProvider = prov?.user_id === userId;
  if (!isClient && !isProvider) return { error: 'Not a participant' };

  if (action === 'generate_start') {
    if (!isClient) return { error: 'Only client can generate start OTP' };
    if (bk.status !== 'confirmed') return { error: 'Booking not confirmed' };
    const otp = bk.start_otp || code4();
    await db.from('home_bookings').update({ start_otp: otp }).eq('id', bookingId);
    return { ok: true, otp };
  }

  if (action === 'verify_start') {
    if (!isProvider) return { error: 'Only provider can verify start OTP' };
    if (bk.status !== 'confirmed') return { error: 'Booking not confirmed' };
    if (!bk.start_otp) return { error: 'No start OTP set' };
    if (!code || code !== bk.start_otp) return { error: 'Invalid OTP' };
    const now = new Date().toISOString();
    await db.from('home_bookings').update({
      status: 'in_progress', started_at: now, start_otp_verified_at: now,
    }).eq('id', bookingId);
    await db.from('home_booking_events').insert({
      booking_id: bookingId, kind: 'started', meta: { verified_by: userId } as Json,
    });
    return { ok: true, status: 'in_progress' };
  }

  if (action === 'generate_end') {
    if (!isProvider) return { error: 'Only provider can generate end OTP' };
    if (bk.status !== 'in_progress') return { error: 'Service not in progress' };
    const otp = bk.end_otp || code4();
    await db.from('home_bookings').update({ end_otp: otp }).eq('id', bookingId);
    return { ok: true, otp };
  }

  if (action === 'verify_end') {
    if (!isClient) return { error: 'Only client can verify end OTP' };
    if (bk.status !== 'in_progress') return { error: 'Service not in progress' };
    if (!bk.end_otp) return { error: 'No end OTP set' };
    if (!code || code !== bk.end_otp) return { error: 'Invalid OTP' };
    const now = new Date().toISOString();
    await db.from('home_bookings').update({
      status: 'completed', completed_at: now, end_otp_verified_at: now, escrow_status: 'released',
    }).eq('id', bookingId);
    await db.from('home_booking_events').insert({
      booking_id: bookingId, kind: 'completed', meta: { verified_by: userId } as Json,
    });

    const { data: stats } = await db.from('home_provider_stats')
      .select('provider_id, jobs_completed, revenue_all_time, revenue_30d')
      .eq('provider_id', bk.provider_id).maybeSingle();
    const { data: bkFull } = await db.from('home_bookings').select('price').eq('id', bookingId).maybeSingle();
    const price = Number(bkFull?.price || 0);
    if (stats) {
      await db.from('home_provider_stats').update({
        jobs_completed: (stats.jobs_completed || 0) + 1,
        revenue_all_time: Number(stats.revenue_all_time || 0) + price,
        revenue_30d: Number(stats.revenue_30d || 0) + price,
        updated_at: now,
      }).eq('provider_id', bk.provider_id);
    } else {
      await db.from('home_provider_stats').insert({
        provider_id: bk.provider_id, jobs_completed: 1, revenue_all_time: price, revenue_30d: price,
      });
    }
    return { ok: true, status: 'completed' };
  }

  return { error: 'unknown action' };
}

/** Events vertical: same shape, but `deposit_paid` also counts as ready to start. */
export async function runEventsOtp(input: OtpInput, userId: string): Promise<OtpResult> {
  const db = await admin();
  const { action, booking_id: bookingId } = input;
  const code = input.code ? String(input.code).trim() : undefined;

  const { data: bk } = await db.from('events_bookings')
    .select('id, provider_id, client_id, status, start_otp, end_otp, start_otp_verified_at, end_otp_verified_at')
    .eq('id', bookingId).maybeSingle();
  if (!bk) return { error: 'Booking not found' };

  const { data: prov } = await db.from('events_providers').select('id, user_id').eq('id', bk.provider_id).maybeSingle();
  const isClient = bk.client_id === userId;
  const isProvider = prov?.user_id === userId;
  if (!isClient && !isProvider) return { error: 'Not a participant' };

  const readyForStart = bk.status === 'confirmed' || bk.status === 'deposit_paid';

  if (action === 'generate_start') {
    if (!isClient) return { error: 'Only client can generate start OTP' };
    if (!readyForStart) return { error: 'Booking not confirmed' };
    const otp = bk.start_otp || code4();
    await db.from('events_bookings').update({ start_otp: otp }).eq('id', bookingId);
    return { ok: true, otp };
  }

  if (action === 'verify_start') {
    if (!isProvider) return { error: 'Only vendor can verify start OTP' };
    if (!readyForStart) return { error: 'Booking not confirmed' };
    if (!bk.start_otp) return { error: 'No start OTP set' };
    if (!code || code !== bk.start_otp) return { error: 'Invalid OTP' };
    const now = new Date().toISOString();
    await db.from('events_bookings').update({
      status: 'in_progress', started_at: now, start_otp_verified_at: now,
    }).eq('id', bookingId);
    await db.from('events_booking_events').insert({
      booking_id: bookingId, kind: 'started', meta: { verified_by: userId } as Json,
    });
    return { ok: true, status: 'in_progress' };
  }

  if (action === 'generate_end') {
    if (!isProvider) return { error: 'Only vendor can generate end OTP' };
    if (bk.status !== 'in_progress') return { error: 'Event not in progress' };
    const otp = bk.end_otp || code4();
    await db.from('events_bookings').update({ end_otp: otp }).eq('id', bookingId);
    return { ok: true, otp };
  }

  if (action === 'verify_end') {
    if (!isClient) return { error: 'Only client can verify end OTP' };
    if (bk.status !== 'in_progress') return { error: 'Event not in progress' };
    if (!bk.end_otp) return { error: 'No end OTP set' };
    if (!code || code !== bk.end_otp) return { error: 'Invalid OTP' };
    const now = new Date().toISOString();
    await db.from('events_bookings').update({
      status: 'completed', completed_at: now, end_otp_verified_at: now, escrow_status: 'released',
    }).eq('id', bookingId);
    await db.from('events_booking_events').insert({
      booking_id: bookingId, kind: 'completed', meta: { verified_by: userId } as Json,
    });

    const { data: stats } = await db.from('events_provider_stats')
      .select('provider_id, events_completed, revenue_all_time, revenue_30d')
      .eq('provider_id', bk.provider_id).maybeSingle();
    const { data: bkFull } = await db.from('events_bookings').select('price').eq('id', bookingId).maybeSingle();
    const price = Number(bkFull?.price || 0);
    if (stats) {
      await db.from('events_provider_stats').update({
        events_completed: (stats.events_completed || 0) + 1,
        revenue_all_time: Number(stats.revenue_all_time || 0) + price,
        revenue_30d: Number(stats.revenue_30d || 0) + price,
        updated_at: now,
      }).eq('provider_id', bk.provider_id);
    } else {
      await db.from('events_provider_stats').insert({
        provider_id: bk.provider_id, events_completed: 1, revenue_all_time: price, revenue_30d: price,
      });
    }
    return { ok: true, status: 'completed' };
  }

  return { error: 'unknown action' };
}

/** Education vertical: student ↔ tutor, session_started / session_completed events. */
export async function runEducationOtp(input: OtpInput, userId: string): Promise<OtpResult> {
  const db = await admin();
  const { action, booking_id: bookingId } = input;
  const code = input.code ? String(input.code).trim() : undefined;

  const { data: bk } = await db.from('education_bookings')
    .select('id, tutor_id, student_id, status, start_otp, end_otp, tutor_earnings_xof')
    .eq('id', bookingId).maybeSingle();
  if (!bk) return { error: 'Booking not found' };

  const { data: tutor } = await db.from('education_tutors').select('id, user_id').eq('id', bk.tutor_id).maybeSingle();
  const isStudent = bk.student_id === userId;
  const isTutor = tutor?.user_id === userId;
  if (!isStudent && !isTutor) return { error: 'Not a participant' };

  if (action === 'generate_start') {
    if (!isStudent) return { error: 'Only student can generate start OTP' };
    if (bk.status !== 'confirmed') return { error: 'Booking not confirmed' };
    const otp = bk.start_otp || code4();
    await db.from('education_bookings').update({ start_otp: otp }).eq('id', bookingId);
    return { ok: true, otp };
  }

  if (action === 'verify_start') {
    if (!isTutor) return { error: 'Only tutor can verify start OTP' };
    if (bk.status !== 'confirmed') return { error: 'Booking not confirmed' };
    if (!bk.start_otp) return { error: 'No start OTP set' };
    if (!code || code !== bk.start_otp) return { error: 'Invalid OTP' };
    const now = new Date().toISOString();
    await db.from('education_bookings').update({ status: 'in_progress', started_at: now }).eq('id', bookingId);
    await db.from('education_booking_events').insert({
      booking_id: bookingId, event_type: 'session_started', actor_id: userId,
    });
    return { ok: true, status: 'in_progress' };
  }

  if (action === 'generate_end') {
    if (!isTutor) return { error: 'Only tutor can generate end OTP' };
    if (bk.status !== 'in_progress') return { error: 'Session not in progress' };
    const otp = bk.end_otp || code4();
    await db.from('education_bookings').update({ end_otp: otp }).eq('id', bookingId);
    return { ok: true, otp };
  }

  if (action === 'verify_end') {
    if (!isStudent) return { error: 'Only student can verify end OTP' };
    if (bk.status !== 'in_progress') return { error: 'Session not in progress' };
    if (!bk.end_otp) return { error: 'No end OTP set' };
    if (!code || code !== bk.end_otp) return { error: 'Invalid OTP' };
    const now = new Date().toISOString();
    await db.from('education_bookings').update({
      status: 'completed', ended_at: now, payment_status: 'released',
    }).eq('id', bookingId);
    await db.from('education_booking_events').insert({
      booking_id: bookingId, event_type: 'session_completed', actor_id: userId,
    });

    const earnings = Number(bk.tutor_earnings_xof || 0);
    const { data: stats } = await db.from('education_tutor_stats')
      .select('*').eq('tutor_id', bk.tutor_id).maybeSingle();
    if (stats) {
      await db.from('education_tutor_stats').update({
        sessions_completed: (stats.sessions_completed || 0) + 1,
        total_earnings_xof: Number(stats.total_earnings_xof || 0) + earnings,
        updated_at: now,
      }).eq('tutor_id', bk.tutor_id);
    } else {
      await db.from('education_tutor_stats').insert({
        tutor_id: bk.tutor_id, sessions_completed: 1, total_earnings_xof: earnings,
      });
    }
    const { data: tutorRow } = await db.from('education_tutors')
      .select('sessions_completed').eq('id', bk.tutor_id).maybeSingle();
    await db.from('education_tutors').update({
      sessions_completed: (Number(tutorRow?.sessions_completed) || 0) + 1,
    }).eq('id', bk.tutor_id);
    return { ok: true, status: 'completed' };
  }

  return { error: 'unknown action' };
}
