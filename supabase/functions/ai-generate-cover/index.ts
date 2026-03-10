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

    const { product_id, title, product_type, description, tier, author_name, book_style } = await req.json();
    if (!product_id || !title) return jsonResp({ error: 'Missing product_id or title' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const result = await consumeCreditsWithRefund({
      admin, userId: auth.userId, actionKey: 'generate_cover', tier: normalizeTier(tier),
      action: async () => {
        const shortDesc = (description || '').slice(0, 300);
        const authorLine = author_name ? `\nAuthor name to display: "${author_name}" — place it elegantly at the bottom of the cover in a refined, smaller font.` : '';

        const genreHints: Record<string, string> = {
          ebook: 'non-fiction book, editorial and sophisticated',
          guide: 'practical guide, structured and authoritative',
          prayer: 'spiritual/devotional, serene with sacred imagery and warm light',
          story: 'narrative fiction, cinematic and atmospheric with a compelling scene',
          novel: 'literary novel, dramatic and immersive with a striking scene or character',
          devotional: 'devotional/spiritual, peaceful with warm golden tones and soft light',
          activity: 'activity/workbook, colorful and engaging with playful elements',
          coloring: 'coloring book, bold line art with decorative border elements',
          children: 'children\'s book, whimsical and enchanting with vivid cartoon illustration',
        };
        const genreHint = genreHints[book_style || ''] || genreHints[product_type || ''] || 'professional book';

        const prompt = `You are an award-winning book cover designer. Create a stunning, publishable book cover for:

TITLE: "${title}"
GENRE: ${genreHint}
${shortDesc ? `ABOUT: ${shortDesc}` : ''}
${authorLine}

DESIGN REQUIREMENTS:
- This must look like a REAL published book cover from a major publishing house (Gallimard, Hachette, Penguin)
- Create a powerful, evocative visual scene or artistic composition that captures the ESSENCE of the book's theme — not just decorative patterns
- The title "${title}" must be prominently displayed with impactful, professional typography — bold, striking, and perfectly legible
- Use cinematic lighting, rich color palette, and dramatic composition
- The overall design should evoke emotion and intrigue — make people WANT to pick up this book
- Portrait format (2:3 ratio), high resolution, print-ready quality
- NO generic AI aesthetic — no bland gradients, no floating abstract shapes
- Think bestseller cover design: atmospheric, bold, memorable

CRITICAL: The typography must be flawless — clean, well-kerned, professionally placed. The title should dominate the upper portion. Any subtitle or author name should be elegantly balanced.`;

        const { base64, mimeType } = await aiGenerateImageBase64({ geminiKey: GEMINI_API_KEY, prompt, timeoutMs: 90_000 });

        const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const fileName = `ai-covers/${product_id}-${Date.now()}.${ext}`;

        const { error: uploadErr } = await admin.storage.from('org-uploads').upload(fileName, imageBytes, { contentType: mimeType, upsert: true });
        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

        const { data: urlData } = admin.storage.from('org-uploads').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl.replace('https://xzgpzbrgsxtcsktiprik.supabase.co', 'https://api.siteviral.com');

        return publicUrl;
      },
    });

    return jsonResp({ ok: true, cover_url: result });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('ai-generate-cover error:', e);
    return jsonResp({ ok: false, error: e instanceof Error ? e.message : 'Internal error' }, 400);
  }
});
