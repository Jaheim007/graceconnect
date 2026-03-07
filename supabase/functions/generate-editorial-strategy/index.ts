import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const langPrompts: Record<string, { system: string; user: (p: any) => string }> = {
  fr: {
    system: `Tu es un STRATÈGE ÉDITORIAL SENIOR avec 20 ans d'expérience dans l'édition de best-sellers. Tu as accompagné des centaines d'auteurs à transformer des idées vagues en livres qui se vendent.

Ta mission : analyser le sujet/idée d'un auteur et créer un POSITIONNEMENT ÉDITORIAL puissant AVANT l'écriture du livre.

Tu retournes UNIQUEMENT un JSON valide. Pas de markdown, pas de code fences.`,
    user: (p: any) => `Sujet / Idée du livre : "${p.topic}"
${p.title ? `Titre envisagé : "${p.title}"` : ''}
Style : ${p.style || 'ebook'}
Public cible : ${p.audience || 'général'}
Ton : ${p.tone || 'professionnel'}

Analyse ce sujet et génère un positionnement éditorial complet.

Retourne UNIQUEMENT ce JSON :
{
  "reader_problem": "Le problème principal que le lecteur cherche à résoudre (1-2 phrases percutantes)",
  "book_promise": "La promesse claire et irrésistible du livre — ce que le lecteur obtiendra (1-2 phrases)",
  "unique_angle": "L'angle unique ou contre-intuitif qui différencie ce livre de tous les autres sur le même sujet (1-2 phrases)",
  "central_thesis": "La thèse centrale du livre — l'idée forte qui traverse tout l'ouvrage (1 phrase puissante)",
  "narrative_arc": "La structure narrative recommandée — comment le livre emmène le lecteur d'un point A à un point B (2-3 phrases)",
  "suggested_stories": [
    "Histoire/exemple concret #1 à intégrer dans le livre",
    "Histoire/exemple concret #2",
    "Histoire/exemple concret #3",
    "Histoire/exemple concret #4",
    "Histoire/exemple concret #5"
  ],
  "improved_title": "Un titre optimisé et percutant basé sur le positionnement (ou le même si déjà bon)"
}`
  },
  en: {
    system: `You are a SENIOR EDITORIAL STRATEGIST with 20 years of experience in bestseller publishing. You've helped hundreds of authors transform vague ideas into books that sell.

Your mission: analyze an author's topic/idea and create a powerful EDITORIAL POSITIONING BEFORE the book is written.

Return ONLY valid JSON. No markdown, no code fences.`,
    user: (p: any) => `Book topic / idea: "${p.topic}"
${p.title ? `Working title: "${p.title}"` : ''}
Style: ${p.style || 'ebook'}
Target audience: ${p.audience || 'general'}
Tone: ${p.tone || 'professional'}

Analyze this topic and generate a complete editorial positioning.

Return ONLY this JSON:
{
  "reader_problem": "The main problem the reader is trying to solve (1-2 punchy sentences)",
  "book_promise": "The clear, irresistible promise of the book — what the reader will get (1-2 sentences)",
  "unique_angle": "The unique or counter-intuitive angle that differentiates this book from all others on the same topic (1-2 sentences)",
  "central_thesis": "The central thesis of the book — the strong idea that runs through the entire work (1 powerful sentence)",
  "narrative_arc": "The recommended narrative structure — how the book takes the reader from point A to point B (2-3 sentences)",
  "suggested_stories": [
    "Concrete story/example #1 to include in the book",
    "Concrete story/example #2",
    "Concrete story/example #3",
    "Concrete story/example #4",
    "Concrete story/example #5"
  ],
  "improved_title": "An optimized, punchy title based on the positioning (or the same if already good)"
}`
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { topic, title, style, audience, tone, language } = await req.json();

    if (!topic && !title) {
      return new Response(JSON.stringify({ error: 'topic or title required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = language === 'en' ? 'en' : 'fr';
    const prompts = langPrompts[lang];
    const params = { topic: topic || title, title, style, audience, tone };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let aiRes: Response;
    try {
      aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: prompts.system },
            { role: 'user', content: prompts.user(params) },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return new Response(JSON.stringify({ error: 'Timeout. Please retry.' }), {
          status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit. Please retry.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiRes.text();
      console.error('AI gateway error:', aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI error (${aiRes.status})` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let cleaned = rawContent
      .replace(/```json\s*/gi, '').replace(/```\s*/g, '')
      .trim();

    // Extract JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }

    let strategy;
    try {
      strategy = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse editorial strategy JSON:', cleaned.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-editorial-strategy error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
