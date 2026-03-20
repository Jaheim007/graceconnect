import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';

// ─── Seeded PRNG (Mulberry32) for deterministic-but-unique variation ───
function mulberry32(seed: number) {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Variation pools: each dimension has many options to rotate through ───

const COMPOSITION_STYLES = [
  'asymmetric layout with title on the left third, illustration bleeding off the right edge',
  'centered symmetrical composition with decorative borders and framing elements',
  'full-bleed background illustration with title overlaid in a contrasting banner',
  'split-screen design: top half illustration, bottom half solid color with text',
  'diagonal composition with elements arranged along a dynamic 30° angle',
  'minimalist: 80% negative space, small powerful illustration element, large typography',
  'layered collage style with overlapping translucent elements and textures',
  'circular vignette illustration in center, text above and below',
  'mosaic/grid of small thematic images forming the background',
  'single dramatic close-up object or face filling most of the cover',
  'vintage poster style with hand-drawn ornamental frames',
  'floating elements scattered across the cover with depth-of-field blur',
];

const TYPOGRAPHY_TREATMENTS = [
  'hand-lettered calligraphic title with flourishes and swashes',
  'bold condensed all-caps sans-serif with tight letter-spacing',
  'elegant thin serif with generous letter-spacing and small caps',
  'mixed typography: display serif for first word, light sans-serif for rest',
  'stencil/military style blocky letters with worn texture',
  'art nouveau inspired decorative letterforms with organic curves',
  'retro slab-serif with drop shadows and dimensional effects',
  'modern geometric sans-serif with one word dramatically larger',
  'handwritten script in a single sweeping line across the cover',
  'typographic hierarchy with subtitle in contrasting weight and color',
  'engraved/embossed style text with metallic or foil effect appearance',
  'watercolor-washed text where letters blend into the background art',
];

const COLOR_MOODS = [
  'warm golden hour palette: amber, honey, burnt sienna, warm cream',
  'cool ocean depths: deep navy, teal, seafoam, silver',
  'forest botanical: sage green, olive, moss, cream, bark brown',
  'sunset fire: coral, magenta, burnt orange, deep purple',
  'arctic minimal: ice blue, white, pale grey, touch of silver',
  'vintage sepia: warm browns, faded cream, dusty rose, antique gold',
  'jewel tones: emerald, sapphire, ruby, amethyst on dark background',
  'pastel dream: blush pink, lavender, mint, pale yellow, sky blue',
  'monochrome drama: pure black and white with one bold accent color (red/gold/blue)',
  'earth and spice: terracotta, turmeric, cinnamon, deep teal',
  'neon futuristic: electric cyan, hot pink, lime green on dark',
  'dusty muted: mauve, slate blue, sage, muted coral, stone grey',
];

const TEXTURE_EFFECTS = [
  'smooth matte finish with subtle paper grain texture',
  'watercolor washes with visible brushstroke textures',
  'oil painting impasto with thick paint texture visible',
  'digital vector art with clean flat surfaces and sharp edges',
  'pencil or charcoal sketch style with visible strokes',
  'metallic foil accents on specific elements (title, ornaments)',
  'linen or fabric texture background',
  'marble or stone texture with veining patterns',
  'bokeh light effects with soft glowing orbs',
  'geometric pattern overlay (chevron, hexagon, arabesque)',
  'woodcut or linocut printmaking style',
  'soft pastel chalk on textured paper appearance',
];

const ILLUSTRATION_APPROACHES = [
  'photorealistic rendering with cinematic lighting',
  'stylized flat illustration with bold shapes and limited palette',
  'dreamy soft-focus with ethereal light leaks',
  'dramatic chiaroscuro with deep shadows and bright highlights',
  'whimsical hand-drawn illustration with ink outlines',
  'abstract geometric shapes suggesting the theme symbolically',
  'detailed botanical/natural illustration style',
  'impressionist painting style with visible brushwork',
  'silhouette art with detailed cutout shapes against gradient',
  'pop art inspired with halftone dots and bold outlines',
  'surrealist composition with unexpected scale and juxtaposition',
  'art deco geometric patterns with gold accents',
];

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

        // ─── Create a unique seed from product_id + timestamp + title ───
        // This ensures EVERY generation is different, even for same book
        const uniqueSeed = hashStr(`${product_id}-${Date.now()}-${title}-${Math.random()}`);
        const rng = mulberry32(uniqueSeed);

        // ─── Resolve style key (handle wizard key mismatches) ───
        const styleMap: Record<string, string> = {
          prayers: 'prayer', prayer: 'prayer',
          ebook: 'ebook', guide: 'guide',
          story: 'story', novel: 'novel',
          devotional: 'devotional', activity: 'activity',
          coloring: 'coloring', children: 'children',
        };
        const resolvedStyle = styleMap[book_style || ''] || styleMap[product_type || ''] || 'ebook';

        // ─── Genre base profiles (thematic anchor only) ───
        const genreAnchors: Record<string, { theme: string; subjects: string[] }> = {
          ebook: {
            theme: 'modern professional knowledge-sharing',
            subjects: ['abstract concepts visualization', 'professional workspace scene', 'symbolic lightbulb/brain/rocket imagery', 'clean data visualization art', 'person reading/working in modern setting'],
          },
          guide: {
            theme: 'structured practical how-to resource',
            subjects: ['step-by-step pathway visualization', 'compass/map/roadmap imagery', 'hands-on workshop scene', 'organized toolkit arrangement', 'before/after transformation'],
          },
          prayer: {
            theme: 'sacred spiritual devotion and connection with God',
            subjects: ['hands clasped in prayer with divine light', 'peaceful sanctuary or temple interior', 'dove ascending with golden rays', 'open Bible with glowing text', 'serene landscape at dawn with cross silhouette', 'candle flame in peaceful darkness'],
          },
          story: {
            theme: 'immersive narrative fiction',
            subjects: ['dramatic scene from the story', 'mysterious doorway or path', 'character silhouette in dramatic setting', 'symbolic object central to plot', 'atmospheric landscape or cityscape'],
          },
          novel: {
            theme: 'literary fiction with depth and sophistication',
            subjects: ['symbolic abstract composition', 'solitary figure in contemplative setting', 'artistic still life arrangement', 'architectural detail with mood', 'nature metaphor (tree, ocean, sky)'],
          },
          devotional: {
            theme: 'daily spiritual nourishment and personal growth',
            subjects: ['sunrise over peaceful landscape', 'journal and coffee morning scene', 'garden with blooming flowers', 'peaceful water reflection', 'warm light through window'],
          },
          activity: {
            theme: 'fun interactive hands-on engagement',
            subjects: ['colorful craft supplies arranged creatively', 'excited children doing activities', 'playful pattern of themed icons', 'game board or puzzle design', 'creative explosion of colors and shapes'],
          },
          coloring: {
            theme: 'intricate artistic patterns to color',
            subjects: ['detailed mandala design', 'botanical line art arrangement', 'animal portrait in ornate style', 'fantasy scene in line art', 'geometric pattern composition'],
          },
          children: {
            theme: 'magical whimsical world for young readers',
            subjects: ['cute animal characters in adventure', 'enchanted forest or magical kingdom', 'friendly dragon or unicorn', 'children exploring fantastical place', 'bedtime scene with stars and moon'],
          },
        };

        const anchor = genreAnchors[resolvedStyle] || genreAnchors['ebook'];

        // ─── Pick UNIQUE variation for each dimension ───
        const chosenComposition = pick(COMPOSITION_STYLES, rng);
        const chosenTypography = pick(TYPOGRAPHY_TREATMENTS, rng);
        const chosenColors = pick(COLOR_MOODS, rng);
        const chosenTexture = pick(TEXTURE_EFFECTS, rng);
        const chosenIllustration = pick(ILLUSTRATION_APPROACHES, rng);
        const chosenSubject = pick(anchor.subjects, rng);

        // ─── Author name handling ───
        const authorLine = author_name
          ? `\n\nAUTHOR NAME — MANDATORY: The author name "${author_name}" MUST appear on the cover. Place it clearly visible, typically at the bottom, in a refined complementary font. This is NON-NEGOTIABLE — the cover is incomplete without the author name.`
          : '';

        const prompt = `You are a senior book cover designer at a top publishing house (Penguin, HarperCollins, Gallimard). Design a REAL, PROFESSIONAL book cover that could sit on a bookstore shelf and sell.

BOOK DETAILS:
- Title: "${title}"
${shortDesc ? `- About: ${shortDesc}` : ''}
- Genre/Theme: ${anchor.theme}

ARTISTIC DIRECTION:
1. COMPOSITION: ${chosenComposition}
2. TYPOGRAPHY: ${chosenTypography}
3. COLOR PALETTE: ${chosenColors}
4. TEXTURE/FINISH: ${chosenTexture}
5. ILLUSTRATION STYLE: ${chosenIllustration}
6. MAIN VISUAL SUBJECT: ${chosenSubject}
${authorLine}

PROFESSIONAL PUBLISHING STANDARDS (CRITICAL):
- This must look like a REAL published book cover, NOT an AI-generated image
- Typography is KING: the title must be perfectly typeset with professional kerning, tracking, and hierarchy — like a real graphic designer placed each letter
- Use CLEAN, POLISHED layout with intentional whitespace and visual breathing room
- The cover should have a CLEAR focal point and visual hierarchy: title → illustration → author name
- Avoid cluttered, busy, or overly detailed compositions — professional covers are REFINED and RESTRAINED
- No cheap-looking gradients, no generic stock photo feel, no oversaturated colors
- Think bestseller shelf appeal: bold, confident, simple yet striking
- The spine area (left edge) should be clean
- Portrait format, 2:3 ratio, print-ready quality
- Text must be PERFECTLY SPELLED and in the SAME LANGUAGE as the title
- The overall aesthetic should scream "professionally published" not "self-published"
- Look at real bestseller covers for reference: clean, bold typography, restrained color palette, one strong visual concept`;

        console.log('[ai-generate-cover] Generating with unique variation:', {
          title: title?.slice(0, 40),
          style: resolvedStyle,
          composition: chosenComposition.slice(0, 50),
          colors: chosenColors.slice(0, 50),
          typography: chosenTypography.slice(0, 50),
        });

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
