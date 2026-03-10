import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsOrThrow, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText } from '../_shared/ai-fallback.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const { prompt, tone = 'professional', context = 'description', tier } = await req.json();
    if (!prompt || typeof prompt !== 'string') return jsonResp({ error: "Le champ 'prompt' est requis." }, 400);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);
    await consumeCreditsOrThrow({ admin, userId: auth.userId, actionKey: 'write_content', tier: normalizeTier(tier) });

    const toneInstructions: Record<string, string> = {
      professional: 'Utilise un ton professionnel, clair et structuré.',
      friendly: 'Utilise un ton amical, chaleureux et accessible.',
      inspiring: 'Utilise un ton inspirant, motivant et enthousiaste.',
      persuasive: 'Utilise un ton persuasif, vendeur et convaincant.',
      educational: 'Utilise un ton pédagogique, didactique et facile à comprendre.',
    };

    const systemPrompt = `Tu es un rédacteur expert en marketing digital pour une plateforme africaine de vente de produits numériques. Tu rédiges des textes en français, percutants et adaptés au contexte africain.

Contexte: Tu rédiges une ${context}.
${toneInstructions[tone] || toneInstructions.professional}

FORMAT DE SORTIE: Tu DOIS retourner du HTML propre. PAS de markdown.

Règles:
- Rédige en français, phrases courtes et impactantes
- Ajoute des emojis pertinents (2-3)
- Structure avec <p>, <strong>, <em>, <br>
- Maximum 300 mots
- IMPORTANT: Ne commence JAMAIS par "Voici une description..."
- IMPORTANT: N'utilise JAMAIS de markdown. Uniquement du HTML.
- Va droit au but`;

    const content = await geminiGenerateText({
      apiKey: GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      system: systemPrompt,
      prompt,
      maxOutputTokens: 1000,
    });

    return jsonResp({ content });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    if (e?.status === 429) return jsonResp({ error: 'Trop de requêtes. Réessayez.' }, 429);
    console.error('ai-write-content error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Erreur interne.' }, 500);
  }
});
