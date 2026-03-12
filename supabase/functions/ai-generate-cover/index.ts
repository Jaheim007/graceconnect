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

    const { product_id, title, subtitle, product_type, description, tier, author_name, book_style, tone, target_audience, religious_tradition, prayer_format, language } = await req.json();
    if (!product_id || !title) return jsonResp({ error: 'Missing product_id or title' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const result = await consumeCreditsWithRefund({
      admin, userId: auth.userId, actionKey: 'generate_cover', tier: normalizeTier(tier),
      action: async () => {
        const shortDesc = (description || '').slice(0, 300);
        const authorLine = author_name ? `Author: "${author_name}"` : '';

        // ══════════════════════════════════════════════════════════════
        // GENRE-SPECIFIC VISUAL PROFILES
        // Each genre has a radically different visual DNA
        // ══════════════════════════════════════════════════════════════

        const genreProfiles: Record<string, { style: string; palette: string; typo: string; layout: string }> = {
          ebook: {
            style: 'clean modern editorial design with bold geometric accents, abstract shapes or subtle 3D renders, magazine-quality',
            palette: 'choose ONE bold scheme: electric blue + white, coral + navy, emerald + gold, OR monochrome with one vivid accent',
            typo: 'modern sans-serif (Futura/Montserrat/Bebas style), mixed weights, title can be lowercase or mixed case — NOT all caps',
            layout: 'asymmetric modern layout, generous white space, title placed dynamically (not always top-center)',
          },
          guide: {
            style: 'structured professional layout with icons, subtle grid patterns, clean photography or isometric illustrations',
            palette: 'trustworthy: deep navy + orange, teal + white, dark green + gold — corporate but warm',
            typo: 'condensed bold sans-serif, clear hierarchy with subtitle, possibly a badge or ribbon element',
            layout: 'organized sections, possibly a banner or stripe design, structured and authoritative',
          },
          prayer: {
            style: religious_tradition === 'muslim'
              ? 'Islamic geometric patterns, crescent moon, mosque silhouette, arabesque ornaments, calligraphic elements'
              : religious_tradition === 'christian'
              ? 'soft light rays, cross or dove silhouette, stained glass inspired elements, peaceful nature (olive branch, water)'
              : 'ethereal sacred geometry, universal spiritual symbols, mandala elements, nature and cosmos imagery',
            palette: religious_tradition === 'muslim'
              ? 'deep emerald green, royal blue, gold filigree, midnight blue with golden accents'
              : religious_tradition === 'christian'
              ? 'soft gold, ivory, celestial blue, warm amber light, purple accents for royalty'
              : 'lavender, soft gold, warm white, cosmic indigo, peaceful earth tones',
            typo: religious_tradition === 'muslim'
              ? 'elegant serif with decorative elements, gold lettering on dark background'
              : 'elegant flowing serif (Cormorant/Playfair style), possibly with script accents, graceful and reverent',
            layout: prayer_format === 'warfare_prayers'
              ? 'dramatic bold composition, shield or sword imagery, intense fire/lightning, commanding and powerful'
              : prayer_format === 'proclamations'
              ? 'regal declarative layout, banner-style, crown or scepter imagery, authoritative yet spiritual'
              : prayer_format === 'invocations'
              ? 'mystical atmosphere, hands raised toward light, heavenly clouds, divine connection'
              : 'centered peaceful composition, soft borders, meditative and inviting',
          },
          story: {
            style: 'cinematic scene illustration with dramatic lighting, rich detailed environment, movie poster composition',
            palette: 'genre-driven: mystery=dark teal/crimson, romance=warm sunset/blush, adventure=golden/emerald, drama=stormy blue',
            typo: 'display font matching genre mood — can be textured, embossed, or stylized, impactful size',
            layout: 'full-bleed illustration with title overlay, dramatic perspective, depth of field',
          },
          novel: {
            style: 'literary artistic cover — abstract symbolic art, minimalist photography, or painterly scene, thought-provoking',
            palette: 'muted sophisticated: dusty rose + sage, midnight blue + cream, charcoal + amber, or bold high-contrast',
            typo: 'refined classic serif (Garamond/Baskerville style), elegant letterspacing, understated elegance',
            layout: 'literary composition — mostly typography with small image, or full artistic scene, prize-winning aesthetic',
          },
          devotional: {
            style: 'warm inviting design with sunrise/sunset scenes, peaceful gardens, flowing water, soft photography style',
            palette: 'warm sunrise: golden amber, soft peach, cream, honey, touches of sage green or sky blue',
            typo: 'warm friendly serif, slightly hand-lettered feel, personal and intimate, inviting',
            layout: 'personal journal aesthetic, centered harmonious composition, daily companion feel',
          },
          activity: {
            style: 'playful energetic design with hand-drawn elements, colorful shapes, stickers aesthetic, notebook textures',
            palette: 'bright fun: yellow/turquoise, coral/purple, lime/pink, rainbow accents — maximum energy',
            typo: 'rounded playful fonts, hand-written style, bubble letters or chunky display, fun and inviting',
            layout: 'dynamic scattered composition, tilted elements, badges, stars, checkboxes visual elements',
          },
          coloring: {
            style: 'intricate black line art on white, mandala-like borders, one section partially colored, decorative frame',
            palette: 'mostly black line art on white/cream with 2-3 strategic color pops showing coloring potential',
            typo: 'decorative hand-lettered title integrated into the artwork, ornamental',
            layout: 'centered ornate frame design, title woven into decorative elements, sample coloring visible',
          },
          children: {
            style: 'whimsical cartoon illustration, cute characters with expressive faces, magical sparkles, storybook dreamscape',
            palette: 'bright cheerful: sunny yellow, sky blue, grass green, candy pink, rainbow, magical sparkles',
            typo: 'bouncy rounded childlike font, possibly 3D effect, tilted playfully, big and fun',
            layout: 'character-centered scene, magical environment, full of wonder and movement',
          },
        };

        // ══════════════════════════════════════════════════════════════
        // TONE MODIFIERS — adjust visual energy
        // ══════════════════════════════════════════════════════════════
        const toneModifiers: Record<string, string> = {
          professional: 'Clean, authoritative, polished. Sharp edges, structured composition.',
          conversational: 'Warm, approachable, friendly. Soft corners, welcoming, casual elegance.',
          humorous: 'Witty, lighthearted, quirky illustration or clever visual pun. Bright and playful.',
          spiritual: 'Transcendent, ethereal, luminous. Soft focus, divine light, sacred atmosphere.',
          poetic: 'Artistic, lyrical, dreamy. Watercolor textures, flowing lines, romantic.',
          academic: 'Scholarly, precise, intellectual. Clean typography, structured, minimal ornamentation.',
        };

        // ══════════════════════════════════════════════════════════════
        // AUDIENCE MODIFIERS
        // ══════════════════════════════════════════════════════════════
        const audienceModifiers: Record<string, string> = {
          children: 'For kids: large text, bright colors, simple shapes, fun safe imagery.',
          teens: 'Cool trendy: modern aesthetic, bold graphics, social-media-ready.',
          adults: 'Mature refined: sophisticated composition, elegant typography, premium.',
          seniors: 'Clear warm: larger readable text, warm comforting colors, classic design.',
          professionals: 'Executive polish: minimal, premium feel, business sophistication.',
          general: 'Universal appeal: balanced, accessible, neither childish nor overly formal.',
        };

        const profile = genreProfiles[book_style || ''] || genreProfiles[product_type || ''] || genreProfiles['ebook'];
        const toneNote = toneModifiers[tone || ''] || toneModifiers['professional'];
        const audienceNote = audienceModifiers[target_audience || ''] || audienceModifiers['general'];
        const langNote = (language || 'fr') === 'en' ? 'All text on the cover MUST be in English.' : 'Tout le texte sur la couverture DOIT être en français.';

        const prompt = `You are the world's #1 book cover designer. Your covers are legendary — no two ever look alike. Design a STUNNING, GENRE-PERFECT cover:

BOOK DETAILS:
- Title: "${title}"${subtitle ? `\n- Subtitle: "${subtitle}"` : ''}
${shortDesc ? `- About: ${shortDesc}` : ''}
${authorLine ? `- ${authorLine}` : ''}

VISUAL DNA (follow precisely — this defines THIS book's unique identity):
- Art direction: ${profile.style}
- Color palette: ${profile.palette}
- Typography style: ${profile.typo}
- Layout composition: ${profile.layout}

TONE: ${toneNote}
AUDIENCE: ${audienceNote}

ABSOLUTE RULES:
1. Follow the VISUAL DNA above exactly — it defines THIS book's unique identity
2. The title "${title}" must be PERFECTLY LEGIBLE with the specified typography style
3. ${author_name ? `"${author_name}" MUST appear clearly on the cover in a complementary smaller font` : 'No author name needed'}
4. Portrait format (2:3 ratio), print-ready, high resolution
5. NEVER default to dark oil paintings or brown/gold tones — USE THE PALETTE SPECIFIED
6. Typography: correct spelling, clean kerning, perfect readability — FLAWLESS
7. This must make someone STOP scrolling and WANT to buy this book immediately
8. ${langNote}
9. Make it look like a TOP 10 bestseller — professional publishing house quality`;

        console.log('[ai-generate-cover] Generating:', title?.slice(0, 50), '| style:', book_style, '| tone:', tone, '| audience:', target_audience, '| religion:', religious_tradition, '| prayer:', prayer_format);
        const { base64, mimeType } = await aiGenerateImageBase64({ geminiKey: GEMINI_API_KEY, prompt, timeoutMs: 120_000 });
        console.log('[ai-generate-cover] Image generated, mimeType:', mimeType, 'base64 length:', base64?.length);

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
