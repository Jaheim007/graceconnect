/**
 * Optional "read replies aloud" for Viral Studio.
 *
 * Uses the platform's own TTS credentials (TTS_PROVIDER / TTS_API_KEY).
 * Returns 501 when TTS is not configured — the client then falls back to the
 * browser's built-in speech synthesis, so the toggle keeps working.
 */
import { corsHeaders, jsonResp, requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const provider = (Deno.env.get('TTS_PROVIDER') || 'google_tts').toLowerCase();
  const apiKey = Deno.env.get('TTS_API_KEY');
  if (!apiKey) return jsonResp({ error: 'tts_not_configured' }, 501);

  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || '').slice(0, 2000).trim();
    const language = body?.language === 'en' ? 'en' : 'fr';
    if (!text) return jsonResp({ error: 'text required' }, 400);

    if (provider === 'elevenlabs') {
      const voice = String(body?.voice || '21m00Tcm4TlvDq8ikWAM');
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        return jsonResp({ error: `TTS failed (${res.status})`, detail }, res.status);
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      let binary = '';
      bytes.forEach((b) => { binary += String.fromCharCode(b); });
      return jsonResp({ audio_base64: btoa(binary), mime: 'audio/mpeg' });
    }

    // Default: Google Cloud Text-to-Speech
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: language === 'fr' ? 'fr-FR' : 'en-US', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error('[viral-studio-speak] tts error', res.status, detail);
      return jsonResp({ error: `TTS failed (${res.status})`, detail }, res.status);
    }

    const data = await res.json();
    if (!data?.audioContent) return jsonResp({ error: 'tts_empty' }, 502);
    return jsonResp({ audio_base64: data.audioContent, mime: 'audio/mpeg' });
  } catch (err) {
    console.error('[viral-studio-speak] error', err);
    return jsonResp({ error: (err as Error)?.message || 'Unexpected error' }, 500);
  }
});
