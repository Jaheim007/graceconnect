import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const artStylePrompts: Record<string, string> = {
  children_book: 'children book illustration style, warm colors, friendly characters, soft lighting, storybook feel',
  watercolor: 'watercolor painting style, soft washes of color, artistic, fluid brushstrokes',
  cartoon: 'modern cartoon illustration, bold colors, clean lines, fun and engaging',
  realistic: 'high-quality photorealistic illustration, cinematic lighting, sharp detail, professional photography quality, natural skin tones and textures, depth of field',
  line_art: 'black and white line art for coloring book, clean bold outlines only, NO shading NO fills NO colors, thick black contour lines on pure white background, large areas to color in',
};

// Variation elements to force unique compositions per illustration
const compositionVariations = [
  'wide establishing shot showing the full scene from a distance',
  'medium shot focusing on the main subject with environmental context',
  'dramatic low-angle perspective looking upward',
  'bird\'s eye view from above showing the scene layout',
  'intimate close-up with shallow depth of field on key details',
  'side profile view with dramatic side lighting',
  'three-quarter view with dynamic diagonal composition',
  'symmetrical centered composition with leading lines',
  'rule of thirds with subject off-center and negative space',
  'panoramic ultra-wide framing with layered foreground and background',
];

const lightingVariations = [
  'golden hour warm sunlight with long shadows',
  'soft diffused overcast lighting, gentle and even',
  'dramatic chiaroscuro with strong light/dark contrast',
  'cool blue moonlight atmosphere',
  'vibrant sunset with orange and purple sky tones',
  'bright midday sun with crisp shadows',
  'misty atmospheric lighting with fog and haze',
  'warm candlelight or firelight glow',
  'backlit silhouette with rim lighting',
  'dappled light filtering through leaves or windows',
];

const moodVariations = [
  'serene and peaceful atmosphere',
  'energetic and dynamic with sense of movement',
  'mysterious and contemplative mood',
  'joyful and celebratory feeling',
  'dramatic and intense emotional tone',
  'nostalgic and warm reminiscence',
  'hopeful and uplifting spirit',
  'quiet introspection and solitude',
];

function getVariation(arr: string[], seed: string, offset = 0): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(hash + offset) % arr.length];
}

const audiencePrompts: Record<string, string> = {
  children: 'age-appropriate for children 6-12, safe and friendly imagery',
  teens: 'suitable for teenagers, modern and dynamic',
  general: 'suitable for all audiences',
  adults: 'sophisticated and mature illustration',
  professionals: 'clean professional illustration',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { bookTitle, chapterTitle, chapterSummary, artStyle, audience, bookStyle, tier } = await req.json();
    if (!chapterTitle) return jsonResp({ error: 'chapterTitle required' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const stylePrompt = artStylePrompts[artStyle] || artStylePrompts['children_book'];
    const audiencePrompt = audiencePrompts[audience] || audiencePrompts['general'];
    const isColoring = artStyle === 'line_art' || bookStyle === 'coloring';

    // Generate unique variation seed from chapter title + book title
    const variationSeed = `${bookTitle || ''}::${chapterTitle}::${Date.now()}`;
    const composition = getVariation(compositionVariations, variationSeed, 0);
    const lighting = getVariation(lightingVariations, variationSeed, 7);
    const mood = getVariation(moodVariations, variationSeed, 13);
    const uniqueId = crypto.randomUUID().slice(0, 6);

    const prompt = isColoring
      ? `Create a coloring book page. BLACK AND WHITE LINE ART ONLY.\nBook: "${bookTitle || 'Untitled'}"\nPage theme: "${chapterTitle}"\nContext: ${chapterSummary || chapterTitle}\nComposition: ${composition}\nCRITICAL: ONLY black outlines on pure white, NO shading/fills/colors, bold clean lines, large enclosed areas for coloring. ${audiencePrompt}. NO text in image. [variation:${uniqueId}]`
      : `Create a UNIQUE wide landscape illustration for a book chapter. Each illustration must look distinctly different from others in the same book.

Book: "${bookTitle || 'Untitled'}"
Chapter: "${chapterTitle}"
Context: ${chapterSummary || chapterTitle}
Style: ${stylePrompt}
Audience: ${audiencePrompt}

UNIQUE VISUAL DIRECTION FOR THIS SPECIFIC CHAPTER:
- Camera/Framing: ${composition}
- Lighting: ${lighting}
- Mood: ${mood}

CRITICAL COMPOSITION RULES:
- LANDSCAPE orientation (wider than tall) — this is a chapter illustration, NOT a book cover
- Frame the scene with generous composition so subjects are fully visible (full body or upper body, never cropped faces)
- Leave breathing room around the main subject — do NOT zoom in too close
- The scene must visually represent THIS SPECIFIC chapter's content — do NOT reuse generic imagery
- Each chapter illustration must have a completely different scene, color palette emphasis, and subject arrangement
- Professional book interior illustration quality
- NO text, NO words, NO letters in the image
[variation:${uniqueId}]`;

    // Use landscape size for chapter illustrations (1536x1024), portrait for covers
    const illustrationSize = '1536x1024';

    const imageUrl = await consumeCreditsWithRefund({
      admin,
      userId: auth.userId,
      actionKey: 'generate_illustration',
      tier: normalizeTier(tier),
      action: async () => {
        console.log('[generate-illustration] Starting generation for:', chapterTitle?.slice(0, 50), 'size:', illustrationSize);
        const { base64, mimeType } = await aiGenerateImageBase64({ geminiKey: GEMINI_API_KEY, prompt, size: illustrationSize, timeoutMs: 120_000 });
        console.log('[generate-illustration] Image generated, mimeType:', mimeType);

        // Upload to storage
        const sb = createClient(auth.supabaseUrl, auth.serviceKey);
        const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const fileName = `illustrations/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

        const { error: uploadError } = await sb.storage.from('org-uploads').upload(fileName, imageBytes, { contentType: mimeType, upsert: false });
        if (uploadError) {
          // Keep successful generation even if storage upload fails
          return `data:${mimeType};base64,${base64}`;
        }

        const { data: publicUrlData } = sb.storage.from('org-uploads').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      },
    });

    return jsonResp({ imageUrl });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    if (e?.status === 429) return jsonResp({ error: 'Rate limit. Please retry.' }, 429);
    console.error('generate-illustration error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
