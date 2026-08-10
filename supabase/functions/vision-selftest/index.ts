/**
 * TEMPORARY self-test: verifies GOOGLE_CLOUD_VISION_API_KEY works on a real
 * handwriting sample and that the Gemini fallback produces text too.
 * Deleted after verification.
 */
import { visionTranscribeImages, geminiTranscribePages } from '../_shared/transcribe-vision.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const SAMPLE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Cursive.svg/512px-Cursive.svg.png';

Deno.serve(async () => {
  const out: Record<string, unknown> = {};
  try {
    const resp = await fetch(SAMPLE);
    const base64 = base64Encode(await resp.arrayBuffer());
    const pages = [{ base64, mimeType: 'image/png' }];

    try {
      const vision = await visionTranscribeImages(Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')!, pages);
      out.vision = { ok: true, chars: vision.length, sample: vision.slice(0, 200) };
    } catch (e) {
      out.vision = { ok: false, error: String(e).slice(0, 400) };
    }

    // Simulate a Cloud Vision outage: bad key → must throw, then Gemini fallback runs
    try {
      await visionTranscribeImages('INVALID_KEY_FORCED_FAILURE', pages);
      out.forced_failure = 'did NOT throw (unexpected)';
    } catch (e) {
      out.forced_failure = `threw as expected: ${String(e).slice(0, 160)}`;
      try {
        const gem = await geminiTranscribePages(Deno.env.get('GEMINI_API_KEY')!, pages);
        out.gemini_fallback = { ok: true, chars: gem.length, sample: gem.slice(0, 200) };
      } catch (ge) {
        out.gemini_fallback = { ok: false, error: String(ge).slice(0, 400) };
      }
    }
  } catch (e) {
    out.error = String(e).slice(0, 400);
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json' } });
});
