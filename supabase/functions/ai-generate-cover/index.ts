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

        // Each genre gets a COMPLETELY different visual identity
        const genreProfiles: Record<string, { style: string; palette: string; typo: string; mood: string }> = {
          ebook: {
            style: 'clean modern editorial design, minimalist with bold geometric accents, flat design or subtle 3D elements',
            palette: 'vibrant and contemporary — electric blue, coral, mint green, or bold monochrome with one accent color',
            typo: 'modern sans-serif (like Futura, Montserrat, or Bebas Neue), clean and sharp, mixed weights',
            mood: 'professional, authoritative, sleek — like a TED talk cover'
          },
          guide: {
            style: 'structured infographic-inspired layout with icons or diagrams, clean sections, professional photography or vector art',
            palette: 'trustworthy blues and greens, or warm oranges with navy, high contrast',
            typo: 'bold condensed sans-serif for title, light weight for subtitle, clear hierarchy',
            mood: 'practical, organized, actionable — like a McKinsey report cover'
          },
          prayer: {
            style: 'ethereal watercolor or soft gradient backgrounds, sacred geometry, dove or light rays, gentle nature imagery',
            palette: 'soft gold, ivory, celestial blue, lavender, warm white — luminous and peaceful',
            typo: 'elegant serif (like Playfair Display or Cormorant), flowing script accents, graceful spacing',
            mood: 'serene, sacred, contemplative — like a meditation retreat invitation'
          },
          story: {
            style: 'cinematic scene illustration, dramatic perspective, rich detailed environment, movie poster composition',
            palette: 'dramatic and genre-appropriate — thriller=dark teal/red, romance=warm sunset, adventure=golden/emerald',
            typo: 'impactful display font, can be stylized to match genre — embossed, textured, or with effects',
            mood: 'immersive, intriguing, page-turner energy — like a Netflix original poster'
          },
          novel: {
            style: 'artistic literary cover, can be abstract, symbolic, or photographic with artistic treatment, sophisticated composition',
            palette: 'muted sophisticated tones — dusty rose, sage green, midnight blue, or bold contrasts for literary fiction',
            typo: 'refined serif (Garamond, Baskerville style), elegant spacing, understated sophistication',
            mood: 'literary, thoughtful, prize-winning — like a Gallimard or Penguin Classics edition'
          },
          devotional: {
            style: 'warm golden light, nature scenes (sunrise, garden, flowing water), peaceful landscapes, soft focus photography style',
            palette: 'warm golds, sunset oranges, soft earth tones, cream and amber, touches of deep burgundy',
            typo: 'warm serif with gentle curves, possibly hand-lettered feel, inviting and personal',
            mood: 'intimate, uplifting, daily companion — like a cherished journal cover'
          },
          activity: {
            style: 'playful and energetic, colorful geometric shapes, hand-drawn elements, stickers and badges aesthetic',
            palette: 'bright primary colors, fun combinations — yellow/turquoise, coral/purple, lime/pink, rainbow accents',
            typo: 'rounded playful fonts, hand-written style, bubble letters or chunky display type',
            mood: 'fun, engaging, hands-on — like a creative workshop poster'
          },
          coloring: {
            style: 'intricate black line art on white or lightly tinted background, mandala-like decorative borders, sample colored section',
            palette: 'mostly black and white line art with strategic pops of color showing the coloring potential',
            typo: 'decorative hand-lettered title integrated into the artwork, ornamental style',
            mood: 'artistic, meditative, inviting to color — like a premium adult coloring book'
          },
          children: {
            style: 'whimsical cartoon illustration, cute characters with big eyes, magical scene, storybook aesthetic',
            palette: 'bright cheerful colors — sunny yellow, sky blue, grass green, candy pink, rainbow elements',
            typo: 'bouncy, rounded, playful childlike font, possibly tilted or with fun effects like shadows',
            mood: 'magical, joyful, bedtime story — like a Pixar movie poster for kids'
          },
        };

        const profile = genreProfiles[book_style || ''] || genreProfiles[product_type || ''] || genreProfiles['ebook'];

        const prompt = `You are an award-winning book cover designer known for creating UNIQUE, genre-specific covers. Create a stunning cover for:

TITLE: "${title}"
${shortDesc ? `ABOUT: ${shortDesc}` : ''}
${authorLine}

VISUAL STYLE: ${profile.style}
COLOR PALETTE: ${profile.palette}
TYPOGRAPHY: ${profile.typo}
MOOD: ${profile.mood}

CRITICAL DESIGN RULES:
1. The visual style MUST match the genre profile above — DO NOT default to dark oil paintings or brown tones
2. Title "${title}" must be prominently displayed with the typography style specified above
3. ${authorLine ? `The author name MUST appear clearly on the cover` : 'No author name needed'}
4. Portrait format (2:3 ratio), print-ready quality
5. Every cover must feel UNIQUE — different genre = completely different look, colors, fonts, and composition
6. The title typography must be FLAWLESS — clean, well-kerned, perfectly legible
7. DO NOT use the same dark/painterly/oil-painting style for every book — match the genre
8. Make it look like it belongs on a bestseller shelf next to professionally designed books`;

        console.log('[ai-generate-cover] Starting image generation for:', title?.slice(0, 50));
        const { base64, mimeType } = await aiGenerateImageBase64({ geminiKey: GEMINI_API_KEY, prompt, timeoutMs: 120_000 });
        console.log('[ai-generate-cover] Image generated successfully, mimeType:', mimeType, 'base64 length:', base64?.length);

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
    if (e?.status === 429) return jsonResp({ error: 'Rate limit exceeded. Please retry in a moment.' }, 429);
    console.error('ai-generate-cover error:', e?.message, 'status:', e?.status, 'detail:', e?.detail?.slice?.(0, 500));
    return jsonResp({ ok: false, error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
