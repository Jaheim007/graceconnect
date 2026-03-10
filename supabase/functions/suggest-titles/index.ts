import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText, extractJson } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { topic, style, audience, language, tier } = await req.json();
    if (!topic) return jsonResp({ error: 'topic required' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // Debit credits
    await consumeCreditsOrThrow({
      admin, userId: auth.userId, actionKey: 'suggest_titles', tier: normalizeTier(tier),
    });

    const lang = ['en', 'es', 'pt', 'de', 'sw'].includes(language) ? language : 'fr';

    const prompt = lang === 'fr'
      ? `Propose exactement 3 titres percutants, créatifs et vendeurs pour un livre.\n\nSujet : "${topic}"\nStyle : ${style || 'ebook'}\nPublic : ${audience || 'général'}\n\nRègles :\n- Titres courts (3-8 mots max)\n- Percutants, mémorables\n- Variés : un provocateur, un promesse claire, un intrigant\n- En français\n\nRetourne UNIQUEMENT : {"titles": ["Titre 1", "Titre 2", "Titre 3"]}`
      : `Suggest exactly 3 punchy, creative, marketable titles for a book.\n\nTopic: "${topic}"\nStyle: ${style || 'ebook'}\nAudience: ${audience || 'general'}\n\nRules:\n- Short (3-8 words)\n- Varied: one provocative, one clear promise, one intriguing\n- In ${lang}\n\nReturn ONLY: {"titles": ["Title 1", "Title 2", "Title 3"]}`;

    const raw = await aiGenerateText({
      geminiKey: GEMINI_API_KEY,
      model: 'gemini-2.5-flash-lite',
      system: 'Return ONLY valid JSON. No markdown, no code fences.',
      prompt,
    });

    const parsed = extractJson(raw);
    if (parsed?.titles && Array.isArray(parsed.titles)) {
      return jsonResp({ titles: parsed.titles.slice(0, 3) });
    }

    return jsonResp({ error: 'Failed to parse titles' }, 500);
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('suggest-titles error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
