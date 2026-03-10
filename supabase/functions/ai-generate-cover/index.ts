import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { product_id, title, product_type, description, tier } = await req.json();
    if (!product_id || !title) return jsonResp({ error: 'Missing product_id or title' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);
    await consumeCreditsOrThrow({ admin, userId: auth.userId, actionKey: 'generate_cover', tier: normalizeTier(tier) });

    const typeHints: Record<string, string> = {
      pdf: 'a professional PDF document cover',
      ebook: 'an elegant e-book cover',
      audio: 'a modern audio content cover with headphones/sound waves',
      video: 'a cinematic video thumbnail',
      course: 'a professional course/training cover',
      link: 'a clean digital resource cover',
    };
    const typeHint = typeHints[product_type || ''] || 'a professional digital product cover';
    const shortDesc = (description || '').slice(0, 200);

    const prompt = `Create ${typeHint} design for a digital product titled "${title}". ${shortDesc ? `The product is about: ${shortDesc}.` : ''} Style: modern, clean, professional, vibrant colors, high contrast text-free design suitable as a product cover image. Aspect ratio 2:3 portrait. Ultra high resolution.`;

    const { base64, mimeType } = await aiGenerateImageBase64({ geminiKey: GEMINI_API_KEY, prompt, timeoutMs: 90_000 });

    // Decode and upload
    const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
    const fileName = `ai-covers/${product_id}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await admin.storage.from('org-uploads').upload(fileName, imageBytes, { contentType: mimeType, upsert: true });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: urlData } = admin.storage.from('org-uploads').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl.replace('https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com');

    return jsonResp({ ok: true, cover_url: publicUrl });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('ai-generate-cover error:', e);
    return jsonResp({ ok: false, error: e instanceof Error ? e.message : 'Internal error' }, 400);
  }
});
