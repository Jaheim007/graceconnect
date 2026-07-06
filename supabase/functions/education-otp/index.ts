// education-otp: dual-OTP flow for Education sessions.
// generate_start (student) → verify_start (tutor) → generate_end (tutor) → verify_end (student, releases escrow).
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function code4() { return String(Math.floor(1000 + Math.random() * 9000)); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const bookingId = body.booking_id as string | undefined;
    const code = body.code ? String(body.code).trim() : undefined;
    if (!bookingId) return json({ error: 'booking_id required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: bk } = await db.from('education_bookings')
      .select('id, tutor_id, student_id, status, start_otp, end_otp, total_xof, tutor_earnings_xof')
      .eq('id', bookingId).maybeSingle();
    if (!bk) return json({ error: 'Booking not found' }, 404);

    const { data: tutor } = await db.from('education_tutors').select('id, user_id').eq('id', bk.tutor_id).maybeSingle();
    const isStudent = bk.student_id === user.id;
    const isTutor = tutor?.user_id === user.id;
    if (!isStudent && !isTutor) return json({ error: 'Not a participant' }, 403);

    if (action === 'generate_start') {
      if (!isStudent) return json({ error: 'Only student can generate start OTP' }, 403);
      if (bk.status !== 'confirmed') return json({ error: 'Booking not confirmed' }, 400);
      const otp = bk.start_otp || code4();
      await db.from('education_bookings').update({ start_otp: otp }).eq('id', bookingId);
      return json({ ok: true, otp });
    }

    if (action === 'verify_start') {
      if (!isTutor) return json({ error: 'Only tutor can verify start OTP' }, 403);
      if (bk.status !== 'confirmed') return json({ error: 'Booking not confirmed' }, 400);
      if (!bk.start_otp) return json({ error: 'No start OTP set' }, 400);
      if (!code || code !== bk.start_otp) return json({ error: 'Invalid OTP' }, 400);
      const now = new Date().toISOString();
      await db.from('education_bookings').update({
        status: 'in_progress', started_at: now,
      }).eq('id', bookingId);
      await db.from('education_booking_events').insert({
        booking_id: bookingId, event_type: 'session_started', actor_id: user.id,
      });
      return json({ ok: true, status: 'in_progress' });
    }

    if (action === 'generate_end') {
      if (!isTutor) return json({ error: 'Only tutor can generate end OTP' }, 403);
      if (bk.status !== 'in_progress') return json({ error: 'Session not in progress' }, 400);
      const otp = bk.end_otp || code4();
      await db.from('education_bookings').update({ end_otp: otp }).eq('id', bookingId);
      return json({ ok: true, otp });
    }

    if (action === 'verify_end') {
      if (!isStudent) return json({ error: 'Only student can verify end OTP' }, 403);
      if (bk.status !== 'in_progress') return json({ error: 'Session not in progress' }, 400);
      if (!bk.end_otp) return json({ error: 'No end OTP set' }, 400);
      if (!code || code !== bk.end_otp) return json({ error: 'Invalid OTP' }, 400);
      const now = new Date().toISOString();
      await db.from('education_bookings').update({
        status: 'completed', ended_at: now, payment_status: 'released',
      }).eq('id', bookingId);
      await db.from('education_booking_events').insert({
        booking_id: bookingId, event_type: 'session_completed', actor_id: user.id,
      });
      // stats bump
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
      await db.from('education_tutors').update({
        sessions_completed: (Number((await db.from('education_tutors').select('sessions_completed').eq('id', bk.tutor_id).maybeSingle()).data?.sessions_completed) || 0) + 1,
      }).eq('id', bk.tutor_id);
      return json({ ok: true, status: 'completed' });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    console.error('[education-otp] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
