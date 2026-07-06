// home-otp: dual-OTP flow for Home bookings.
// Actions:
//   - generate_start : client issues a 4-digit code the provider must enter to start
//   - verify_start   : provider submits code → sets started_at + in_progress
//   - generate_end   : provider issues a 4-digit code the client must enter to end
//   - verify_end     : client submits code → sets completed_at + completed (escrow release)

import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function code4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

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
    const { data: bk } = await db.from('home_bookings')
      .select('id, provider_id, client_id, status, start_otp, end_otp, start_otp_verified_at, end_otp_verified_at')
      .eq('id', bookingId).maybeSingle();
    if (!bk) return json({ error: 'Booking not found' }, 404);

    const { data: prov } = await db.from('home_providers').select('id, user_id').eq('id', bk.provider_id).maybeSingle();
    const isClient = bk.client_id === user.id;
    const isProvider = prov?.user_id === user.id;
    if (!isClient && !isProvider) return json({ error: 'Not a participant' }, 403);

    // ── generate_start (client only)
    if (action === 'generate_start') {
      if (!isClient) return json({ error: 'Only client can generate start OTP' }, 403);
      if (bk.status !== 'confirmed') return json({ error: 'Booking not confirmed' }, 400);
      const otp = bk.start_otp || code4();
      await db.from('home_bookings').update({ start_otp: otp }).eq('id', bookingId);
      return json({ ok: true, otp });
    }

    // ── verify_start (provider only)
    if (action === 'verify_start') {
      if (!isProvider) return json({ error: 'Only provider can verify start OTP' }, 403);
      if (bk.status !== 'confirmed') return json({ error: 'Booking not confirmed' }, 400);
      if (!bk.start_otp) return json({ error: 'No start OTP set' }, 400);
      if (!code || code !== bk.start_otp) return json({ error: 'Invalid OTP' }, 400);
      const now = new Date().toISOString();
      await db.from('home_bookings').update({
        status: 'in_progress',
        started_at: now,
        start_otp_verified_at: now,
      }).eq('id', bookingId);
      await db.from('home_booking_events').insert({
        booking_id: bookingId, kind: 'started', meta: { verified_by: user.id },
      });
      return json({ ok: true, status: 'in_progress' });
    }

    // ── generate_end (provider only)
    if (action === 'generate_end') {
      if (!isProvider) return json({ error: 'Only provider can generate end OTP' }, 403);
      if (bk.status !== 'in_progress') return json({ error: 'Service not in progress' }, 400);
      const otp = bk.end_otp || code4();
      await db.from('home_bookings').update({ end_otp: otp }).eq('id', bookingId);
      return json({ ok: true, otp });
    }

    // ── verify_end (client only) → releases escrow
    if (action === 'verify_end') {
      if (!isClient) return json({ error: 'Only client can verify end OTP' }, 403);
      if (bk.status !== 'in_progress') return json({ error: 'Service not in progress' }, 400);
      if (!bk.end_otp) return json({ error: 'No end OTP set' }, 400);
      if (!code || code !== bk.end_otp) return json({ error: 'Invalid OTP' }, 400);
      const now = new Date().toISOString();
      await db.from('home_bookings').update({
        status: 'completed',
        completed_at: now,
        end_otp_verified_at: now,
        escrow_status: 'released',
      }).eq('id', bookingId);
      await db.from('home_booking_events').insert({
        booking_id: bookingId, kind: 'completed', meta: { verified_by: user.id },
      });
      // Best-effort stats bump
      await db.rpc('noop').catch(() => null);
      const { data: stats } = await db.from('home_provider_stats')
        .select('provider_id, jobs_completed, revenue_all_time, revenue_30d').eq('provider_id', bk.provider_id).maybeSingle();
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
          provider_id: bk.provider_id,
          jobs_completed: 1, revenue_all_time: price, revenue_30d: price,
        });
      }
      return json({ ok: true, status: 'completed' });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    console.error('[home-otp] fatal', e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
