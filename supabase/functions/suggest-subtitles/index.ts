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

    const { title, topic, style, audience, language, tier } = await req.json();
    if (!title) return jsonResp({ error: 'title required' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    const result = await consumeCreditsWithRefund({
      admin, userId: auth.userId, actionKey: 'suggest_titles', tier: normalizeTier(tier),
      action: async () => {
        const lang = ['en', 'es', 'pt', 'de', 'sw'].includes(language) ? language : 'fr';

        const prompt = lang === 'fr'
          ? `Propose exactement 3 sous-titres percutants pour un livre.\n\nTitre : "${title}"\nSujet : "${topic || ''}"\nStyle : ${style || 'ebook'}\nPublic : ${audience || 'général'}\n\nRègles :\n- Sous-titres complémentaires au titre (5-12 mots)\n- Qui clarifient la promesse du livre\n- Variés : un descriptif, un émotionnel, un orienté bénéfice\n- En français correct et naturel\n- INTERDIT : regex, caractères spéciaux comme (?:), |, [], (), *, +\n- Chaque sous-titre doit être du texte lisible par un humain\n\nRetourne UNIQUEMENT : {"subtitles": ["Sous-titre 1", "Sous-titre 2", "Sous-titre 3"]}`
          : `Suggest exactly 3 compelling subtitles for a book.\n\nTitle: "${title}"\nTopic: "${topic || ''}"\nStyle: ${style || 'ebook'}\nAudience: ${audience || 'general'}\n\nRules:\n- Complementary to the title (5-12 words)\n- Clarify the book's promise\n- Varied: one descriptive, one emotional, one benefit-oriented\n- In ${lang}\n- FORBIDDEN: regex patterns, special characters like (?:), |, [], (), *, +\n- Each subtitle must be clean, human-readable text\n\nReturn ONLY: {"subtitles": ["Subtitle 1", "Subtitle 2", "Subtitle 3"]}`;

        const raw = await aiGenerateText({
          geminiKey: GEMINI_API_KEY,
          model: 'gemini-2.5-flash',
          system: 'You are a professional book subtitle creator. Return ONLY valid JSON. No markdown, no code fences. Every subtitle must be clean human-readable text with no regex, no special syntax, no programming patterns.',
          prompt,
        });

        const parsed = extractJson(raw);
        if (parsed?.subtitles && Array.isArray(parsed.subtitles)) {
          const clean = parsed.subtitles.slice(0, 3).map((t: string) =>
            t.replace(/\(\?:[^)]*\)/g, '').replace(/[|[\]{}()*+?\\^$]/g, '').replace(/\s{2,}/g, ' ').trim()
          ).filter((t: string) => t.length > 2);
          if (clean.length > 0) return clean;
        }
        throw new Error('Failed to parse subtitles');
      },
    });

    return jsonResp({ subtitles: result });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('suggest-subtitles error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
