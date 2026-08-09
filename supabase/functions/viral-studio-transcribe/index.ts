/**
 * Deepgram speech-to-text proxy for Viral Studio.
 *
 * The browser records short WAV windows and POSTs them here; DEEPGRAM_API_KEY
 * never leaves the server. Returns the transcript so the client can show it in
 * an editable field (the user always reviews before sending).
 */
import { corsHeaders, jsonResp, requireAuth } from '../_shared/auth.ts';

const MAX_BYTES = 12 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const key = Deno.env.get('DEEPGRAM_API_KEY');
  if (!key) return jsonResp({ error: 'DEEPGRAM_API_KEY not configured' }, 501);

  try {
    const form = await req.formData();
    const file = form.get('file');
    const langRaw = String(form.get('language') || 'fr');
    const language = langRaw === 'en' ? 'en' : 'fr';

    if (!(file instanceof File)) return jsonResp({ error: 'file required' }, 400);
    if (file.size < 2048) return jsonResp({ error: 'audio_too_short', text: '' }, 400);
    if (file.size > MAX_BYTES) return jsonResp({ error: 'audio_too_large' }, 413);

    const params = new URLSearchParams({
      model: 'nova-2',
      language,
      smart_format: 'true',
      punctuate: 'true',
    });

    const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${key}`,
        'Content-Type': file.type || 'audio/wav',
      },
      body: await file.arrayBuffer(),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 400);
      console.error('[viral-studio-transcribe] deepgram error', res.status, detail);
      return jsonResp({ error: `Transcription failed (${res.status})`, detail }, res.status);
    }

    const data = await res.json();
    const text: string = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    return jsonResp({ text });
  } catch (err) {
    console.error('[viral-studio-transcribe] error', err);
    return jsonResp({ error: (err as Error)?.message || 'Unexpected error' }, 500);
  }
});
