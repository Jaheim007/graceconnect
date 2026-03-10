import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsOrThrow, normalizeTier } from '../_shared/credits.ts';
import { geminiGenerateText, extractJson } from '../_shared/ai-gemini.ts';

const langPrompts: Record<string, { system: string; user: (p: any) => string }> = {
  fr: {
    system: `Tu es un STRATÈGE ÉDITORIAL SENIOR avec 20 ans d'expérience dans l'édition de best-sellers. Ta mission : analyser le sujet d'un auteur et créer un POSITIONNEMENT ÉDITORIAL puissant AVANT l'écriture. Tu retournes UNIQUEMENT un JSON valide.`,
    user: (p: any) => `Sujet / Idée du livre : "${p.topic}"
${p.title ? `Titre envisagé : "${p.title}"` : ''}
Style : ${p.style || 'ebook'}
Public cible : ${p.audience || 'général'}
Ton : ${p.tone || 'professionnel'}

Retourne UNIQUEMENT ce JSON :
{
  "reader_problem": "Le problème principal (1-2 phrases)",
  "book_promise": "La promesse claire et irrésistible (1-2 phrases)",
  "unique_angle": "L'angle unique qui différencie ce livre (1-2 phrases)",
  "central_thesis": "La thèse centrale (1 phrase puissante)",
  "narrative_arc": "La structure narrative recommandée (2-3 phrases)",
  "suggested_stories": ["Histoire #1", "Histoire #2", "Histoire #3", "Histoire #4", "Histoire #5"],
  "improved_title": "Un titre optimisé"
}`
  },
  en: {
    system: `You are a SENIOR EDITORIAL STRATEGIST with 20 years experience. Analyze an author's topic and create a powerful EDITORIAL POSITIONING. Return ONLY valid JSON.`,
    user: (p: any) => `Book topic: "${p.topic}"
${p.title ? `Working title: "${p.title}"` : ''}
Style: ${p.style || 'ebook'}  Audience: ${p.audience || 'general'}  Tone: ${p.tone || 'professional'}

Return ONLY JSON:
{
  "reader_problem": "...", "book_promise": "...", "unique_angle": "...",
  "central_thesis": "...", "narrative_arc": "...",
  "suggested_stories": ["#1","#2","#3","#4","#5"],
  "improved_title": "..."
}`
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);

    const { topic, title, style, audience, tone, language, tier } = await req.json();
    if (!topic && !title) return jsonResp({ error: 'topic or title required' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);
    await consumeCreditsOrThrow({ admin, userId: auth.userId, actionKey: 'editorial_strategy', tier: normalizeTier(tier) });

    const lang = language === 'en' ? 'en' : 'fr';
    const prompts = langPrompts[lang];
    const params = { topic: topic || title, title, style, audience, tone };

    const raw = await geminiGenerateText({
      apiKey: GEMINI_API_KEY, model: 'gemini-2.5-flash',
      system: prompts.system, prompt: prompts.user(params),
      maxOutputTokens: 2048, jsonMode: true,
    });

    const strategy = extractJson(raw);
    if (!strategy) return jsonResp({ error: 'Failed to parse AI response' }, 500);

    return jsonResp({ strategy });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    if (e?.status === 429) return jsonResp({ error: 'Rate limit. Please retry.' }, 429);
    console.error('generate-editorial-strategy error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
