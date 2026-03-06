import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, topic, style, chapters, language } = await req.json();

    if (!title || !chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return new Response(JSON.stringify({ error: 'title and chapters required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = language || 'fr';
    const styleLabel = style === 'guide' ? 'guide pratique' : style === 'prayers' ? 'livre de prières et méditations' : 'ebook structuré';
    const chapterList = chapters.map((ch: any, i: number) => `${i + 1}. ${ch.title}`).join('\n');

    const systemPrompt = lang === 'fr'
      ? `Tu es un auteur professionnel expert. Tu rédiges du contenu de haute qualité en français.
Ton style est engageant, clair et adapté au format "${styleLabel}".
FORMAT: Retourne un JSON valide. Pas de markdown, pas de code fences.`
      : `You are a professional expert author. You write high-quality content in English.
Your style is engaging, clear and adapted to the "${styleLabel}" format.
FORMAT: Return valid JSON. No markdown, no code fences.`;

    const userPrompt = lang === 'fr'
      ? `Rédige le contenu complet de chaque chapitre pour le livre "${title}".
${topic ? `Sujet/contexte: ${topic}` : ''}

Chapitres à rédiger:
${chapterList}

Pour chaque chapitre, rédige 400-600 mots de contenu riche et structuré en HTML (<p>, <h3>, <strong>, <em>, <ul>, <li>).

Retourne UNIQUEMENT un JSON avec cette structure:
{
  "chapters": [
    {"id": "ch-1", "title": "...", "content": "<p>Contenu HTML riche...</p>"},
    {"id": "ch-2", "title": "...", "content": "<p>Contenu HTML riche...</p>"}
  ]
}

IMPORTANT: Chaque chapitre doit avoir un contenu substantiel et unique. Ne mets PAS de placeholder.`
      : `Write the complete content for each chapter of the book "${title}".
${topic ? `Topic/context: ${topic}` : ''}

Chapters to write:
${chapterList}

For each chapter, write 400-600 words of rich, structured HTML content (<p>, <h3>, <strong>, <em>, <ul>, <li>).

Return ONLY a JSON with this structure:
{
  "chapters": [
    {"id": "ch-1", "title": "...", "content": "<p>Rich HTML content...</p>"},
    {"id": "ch-2", "title": "...", "content": "<p>Rich HTML content...</p>"}
  ]
}

IMPORTANT: Each chapter must have substantial, unique content. No placeholders.`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
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
    const cleaned = rawContent.replace(/```[\w]*\n?/gi, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('Failed to parse AI response:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('generate-book-content error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
