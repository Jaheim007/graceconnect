import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { title, product_type, price, currency, language, tier } = await req.json();
    if (!title || title.length < 3) return jsonResp({ error: 'Title is required (min 3 chars)' }, 400);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const result = await consumeCreditsWithRefund({
      admin, userId: auth.userId, actionKey: 'generate_description', tier: normalizeTier(tier),
      action: async () => {
        const isFr = language === 'fr';
        const priceText = price > 0 ? `${price} ${currency || 'XOF'}` : (isFr ? 'Gratuit' : 'Free');

        const prompt = isFr
          ? `Tu es un expert en copywriting de vente pour des produits digitaux africains. Écris une description de vente HTML compelling pour:\n\nTitre: "${title}"\nType: ${product_type}\nPrix: ${priceText}\n\nRègles:\n- Français africain naturel\n- Emojis avec parcimonie (2-3)\n- Structure HTML <p>, <strong>, <ul><li>\n- Accroche forte, 3-4 bénéfices, appel à l'action\n- 150-250 mots max\n- Pas de titre H1/H2\n- Concret et orienté résultat`
          : `You are a sales copywriting expert for digital products. Write a compelling HTML sales description for:\n\nTitle: "${title}"\nType: ${product_type}\nPrice: ${priceText}\n\nRules:\n- Engaging English, emojis sparingly\n- HTML <p>, <strong>, <ul><li>\n- Strong hook, 3-4 benefits, CTA\n- 150-250 words, no H1/H2\n- Concrete and results-oriented`;

        const description = await aiGenerateText({
          geminiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash', prompt, temperature: 0.7, maxOutputTokens: 1000,
        });

        return description.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      },
    });

    return jsonResp({ description: result });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('ai-generate-description error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
