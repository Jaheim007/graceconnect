// Transcribe a church sermon audio file using OpenAI Whisper.
// Owner-only. Downloads from private storage using service role, sends multipart
// to OpenAI, saves transcript + status back to church_sermons.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return json({ error: 'OPENAI_API_KEY not configured' }, 500);
    }

    // Auth: verify caller via anon client with bearer token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { sermon_id, language } = await req.json().catch(() => ({}));
    if (!sermon_id) return json({ error: 'sermon_id required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch sermon + verify ownership
    const { data: sermon, error: sErr } = await db
      .from('church_sermons')
      .select('id, church_id, audio_url, transcript_status')
      .eq('id', sermon_id)
      .maybeSingle();
    if (sErr || !sermon) return json({ error: 'Sermon not found' }, 404);

    const { data: church } = await db
      .from('church_providers')
      .select('id, user_id')
      .eq('id', sermon.church_id)
      .maybeSingle();
    if (!church || church.user_id !== userId) return json({ error: 'Forbidden' }, 403);
    if (!sermon.audio_url) return json({ error: 'No audio uploaded' }, 400);

    // Mark transcribing
    await db.from('church_sermons').update({ transcript_status: 'transcribing' }).eq('id', sermon_id);

    // audio_url is stored as bucket path (e.g. "<church_id>/xxx.mp3")
    const path = sermon.audio_url.replace(/^church-sermons\//, '');
    const { data: file, error: dlErr } = await db.storage.from('church-sermons').download(path);
    if (dlErr || !file) {
      await db.from('church_sermons').update({ transcript_status: 'failed' }).eq('id', sermon_id);
      return json({ error: 'Audio download failed', detail: dlErr?.message }, 500);
    }

    // Cap size at 24MB to stay under Whisper's 25MB limit
    if (file.size > 24 * 1024 * 1024) {
      await db.from('church_sermons').update({ transcript_status: 'failed' }).eq('id', sermon_id);
      return json({ error: 'Audio exceeds 24MB. Please split the recording.' }, 400);
    }

    const ext = (path.split('.').pop() || 'mp3').toLowerCase();
    const form = new FormData();
    form.append('file', file, `sermon.${ext}`);
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    if (language) form.append('language', String(language).slice(0, 2));

    const wRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });

    if (!wRes.ok) {
      const detail = await wRes.text().catch(() => '');
      await db.from('church_sermons').update({ transcript_status: 'failed' }).eq('id', sermon_id);
      return json({ error: `Whisper failed (${wRes.status})`, detail: detail.slice(0, 400) }, 502);
    }

    const result: any = await wRes.json();
    const transcript: string = result?.text || '';
    const detectedLanguage: string = result?.language || language || null;
    const durationS: number | null = result?.duration ? Math.round(result.duration) : null;

    // Detect low-confidence segments (avg_logprob < -0.75 or no_speech_prob > 0.4)
    const unclear = Array.isArray(result?.segments)
      ? result.segments
          .filter((s: any) => (s?.avg_logprob ?? 0) < -0.75 || (s?.no_speech_prob ?? 0) > 0.4)
          .slice(0, 20)
          .map((s: any) => ({ start_s: Math.round(s.start), end_s: Math.round(s.end), note: 'low_confidence' }))
      : [];

    const update: Record<string, unknown> = {
      transcript,
      transcript_status: 'ready',
      unclear_sections: unclear,
    };
    if (detectedLanguage) update.transcript_language = detectedLanguage;
    if (durationS) update.duration_s = durationS;

    await db.from('church_sermons').update(update).eq('id', sermon_id);

    return json({ ok: true, transcript_length: transcript.length, unclear_count: unclear.length });
  } catch (e: any) {
    return json({ error: e?.message || 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
