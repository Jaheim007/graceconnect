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

    const { title, topic, style, pageCount, language } = await req.json();

    if (!title && !topic) {
      return new Response(JSON.stringify({ error: 'title or topic required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = language || 'fr';
    const pages = pageCount || 20;
    const chapterCount = Math.max(3, Math.min(10, Math.round(pages / 4)));

    // Style only affects TONE, not chapter structure
    const styleInstructions: Record<string, Record<string, string>> = {
      fr: {
        ebook: 'Ton professionnel, structuré et engageant. Utilise des exemples concrets et des explications claires.',
        guide: 'Ton pratique et actionnable. Chaque chapitre doit contenir des étapes concrètes, des conseils et des exercices.',
        prayers: 'Ton spirituel, méditatif et inspirant. Utilise un langage poétique et profond.',
      },
      en: {
        ebook: 'Professional, structured and engaging tone. Use concrete examples and clear explanations.',
        guide: 'Practical and actionable tone. Each chapter should contain concrete steps, tips and exercises.',
        prayers: 'Spiritual, meditative and inspiring tone. Use poetic and deep language.',
      },
    };

    const toneInstruction = (styleInstructions[lang] || styleInstructions.fr)[style] || (styleInstructions[lang] || styleInstructions.fr).ebook;

    const systemPrompt = lang === 'fr'
      ? `Tu es un auteur professionnel expert. Tu rédiges des livres de haute qualité en français.
${toneInstruction}
Tu DOIS créer les chapitres EN FONCTION DU SUJET/IDÉE fourni par l'utilisateur. Chaque chapitre doit explorer un aspect spécifique du sujet.
FORMAT: Retourne un JSON valide. Pas de markdown, pas de code fences.`
      : `You are a professional expert author. You write high-quality books in English.
${toneInstruction}
You MUST create chapters BASED ON THE TOPIC/IDEA provided by the user. Each chapter must explore a specific aspect of the topic.
FORMAT: Return valid JSON. No markdown, no code fences.`;

    const userPrompt = lang === 'fr'
      ? `Crée un livre complet sur le sujet suivant :

TITRE : "${title}"
${topic ? `IDÉE / SUJET : ${topic}` : ''}

CONSIGNES :
- Crée exactement ${chapterCount} chapitres qui explorent différents aspects de CE sujet spécifique
- Les titres de chapitres doivent être directement liés au sujet "${topic || title}"
- Chaque chapitre doit contenir 400-600 mots de contenu riche en HTML (<p>, <h3>, <strong>, <em>, <ul>, <li>)
- Le contenu doit être substantiel, informatif et unique à chaque chapitre
- Commence par une introduction et termine par une conclusion
- NE crée PAS de chapitres génériques. Tous les chapitres doivent être spécifiques au sujet donné

Retourne UNIQUEMENT un JSON avec cette structure :
{
  "chapters": [
    {"id": "ch-1", "title": "Titre spécifique au sujet...", "content": "<p>Contenu HTML riche...</p>"},
    {"id": "ch-2", "title": "Titre spécifique au sujet...", "content": "<p>Contenu HTML riche...</p>"}
  ]
}

IMPORTANT: Chaque chapitre doit directement traiter du sujet "${topic || title}". Pas de contenu générique.`
      : `Create a complete book on the following topic:

TITLE: "${title}"
${topic ? `IDEA / TOPIC: ${topic}` : ''}

INSTRUCTIONS:
- Create exactly ${chapterCount} chapters that explore different aspects of THIS specific topic
- Chapter titles must be directly related to the topic "${topic || title}"
- Each chapter must contain 400-600 words of rich HTML content (<p>, <h3>, <strong>, <em>, <ul>, <li>)
- Content must be substantial, informative and unique to each chapter
- Start with an introduction and end with a conclusion
- Do NOT create generic chapters. All chapters must be specific to the given topic

Return ONLY a JSON with this structure:
{
  "chapters": [
    {"id": "ch-1", "title": "Topic-specific title...", "content": "<p>Rich HTML content...</p>"},
    {"id": "ch-2", "title": "Topic-specific title...", "content": "<p>Rich HTML content...</p>"}
  ]
}

IMPORTANT: Each chapter must directly address the topic "${topic || title}". No generic content.`;

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
