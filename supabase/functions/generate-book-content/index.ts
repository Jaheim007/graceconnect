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

    const { title, topic, style, pageCount, language, tone, languageLevel, targetAudience, singleChapter, chapterTitle } = await req.json();

    if (!title && !topic) {
      return new Response(JSON.stringify({ error: 'title or topic required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = language || 'fr';
    const pages = pageCount || 20;
    const chapterCount = singleChapter ? 1 : Math.max(3, Math.min(10, Math.round(pages / 4)));

    // Tone mapping
    const toneMap: Record<string, Record<string, string>> = {
      fr: {
        professional: 'Ton professionnel, structuré et engageant. Utilise des exemples concrets et des explications claires.',
        conversational: 'Ton conversationnel et accessible. Écris comme si tu parlais à un ami, avec un langage simple et des anecdotes.',
        humorous: 'Ton humoristique et léger. Utilise de l\'humour, des métaphores amusantes et un style divertissant tout en étant informatif.',
        spiritual: 'Ton spirituel, méditatif et inspirant. Inclus des versets bibliques, des sourates, des citations spirituelles ou des prières selon le contexte. Utilise un langage profond et réconfortant.',
        poetic: 'Ton poétique et littéraire. Utilise des métaphores, des images évocatrices et un style lyrique et expressif.',
        academic: 'Ton académique et rigoureux. Utilise des références, des données, des analyses approfondies et un vocabulaire précis.',
      },
      en: {
        professional: 'Professional, structured and engaging tone. Use concrete examples and clear explanations.',
        conversational: 'Conversational and accessible tone. Write as if talking to a friend, with simple language and anecdotes.',
        humorous: 'Humorous and light tone. Use humor, funny metaphors and an entertaining yet informative style.',
        spiritual: 'Spiritual, meditative and inspiring tone. Include Bible verses, Surahs, spiritual quotes or prayers as relevant. Use deep and comforting language.',
        poetic: 'Poetic and literary tone. Use metaphors, evocative imagery and a lyrical, expressive style.',
        academic: 'Academic and rigorous tone. Use references, data, in-depth analyses and precise vocabulary.',
      },
    };

    // Language level mapping
    const levelMap: Record<string, Record<string, string>> = {
      fr: {
        simple: 'Utilise un vocabulaire simple et des phrases courtes. Le texte doit être compréhensible par tous, même les débutants ou les enfants de 12 ans.',
        intermediate: 'Utilise un vocabulaire courant avec quelques termes spécialisés expliqués. Accessible au grand public éduqué.',
        advanced: 'Utilise un vocabulaire riche et soutenu. Le texte peut inclure des termes techniques et un style littéraire élaboré.',
      },
      en: {
        simple: 'Use simple vocabulary and short sentences. The text should be understandable by everyone, including beginners or 12-year-olds.',
        intermediate: 'Use common vocabulary with some specialized terms explained. Accessible to the educated general public.',
        advanced: 'Use rich and sophisticated vocabulary. The text can include technical terms and an elaborate literary style.',
      },
    };

    // Target audience mapping
    const audienceMap: Record<string, Record<string, string>> = {
      fr: {
        general: 'Public général, tout âge confondu.',
        children: 'Livre pour enfants (6-12 ans). Utilise un langage simple, des histoires courtes, des illustrations textuelles et beaucoup d\'imagination.',
        teens: 'Adolescents (13-18 ans). Utilise un ton dynamique, des exemples de la vie quotidienne des jeunes et un style engageant.',
        adults: 'Adultes. Contenu mature, réflexions profondes et exemples de la vie adulte.',
        seniors: 'Seniors. Ton respectueux, références culturelles classiques, nostalgie et sagesse.',
        professionals: 'Professionnels et experts du domaine. Contenu avancé avec données, études de cas et méthodologies.',
      },
      en: {
        general: 'General audience, all ages.',
        children: 'Book for children (6-12 years). Use simple language, short stories, textual illustrations and lots of imagination.',
        teens: 'Teenagers (13-18 years). Use a dynamic tone, examples from young people\'s daily life and an engaging style.',
        adults: 'Adults. Mature content, deep reflections and examples from adult life.',
        seniors: 'Seniors. Respectful tone, classic cultural references, nostalgia and wisdom.',
        professionals: 'Professionals and domain experts. Advanced content with data, case studies and methodologies.',
      },
    };

    const _tone = tone || 'professional';
    const _level = languageLevel || 'intermediate';
    const _audience = targetAudience || 'general';

    const toneInstruction = (toneMap[lang] || toneMap.fr)[_tone] || (toneMap[lang] || toneMap.fr).professional;
    const levelInstruction = (levelMap[lang] || levelMap.fr)[_level] || (levelMap[lang] || levelMap.fr).intermediate;
    const audienceInstruction = (audienceMap[lang] || audienceMap.fr)[_audience] || (audienceMap[lang] || audienceMap.fr).general;

    // Style only affects structure format
    const styleFormatMap: Record<string, Record<string, string>> = {
      fr: {
        ebook: 'Structure en chapitres narratifs avec des transitions fluides.',
        guide: 'Structure avec des étapes concrètes, des listes à puces, des conseils pratiques et des exercices.',
        prayers: 'Structure en sections de prières, méditations et réflexions spirituelles. Inclus des versets et citations sacrées.',
      },
      en: {
        ebook: 'Structure with narrative chapters and smooth transitions.',
        guide: 'Structure with concrete steps, bullet lists, practical tips and exercises.',
        prayers: 'Structure with prayer sections, meditations and spiritual reflections. Include verses and sacred quotes.',
      },
    };
    const formatInstruction = (styleFormatMap[lang] || styleFormatMap.fr)[style] || (styleFormatMap[lang] || styleFormatMap.fr).ebook;

    const systemPrompt = lang === 'fr'
      ? `Tu es un auteur professionnel expert. Tu rédiges des livres de haute qualité en français.

STYLE D'ÉCRITURE :
${toneInstruction}

NIVEAU DE LANGUE :
${levelInstruction}

PUBLIC CIBLE :
${audienceInstruction}

FORMAT :
${formatInstruction}

Tu DOIS créer les chapitres EN FONCTION DU SUJET/IDÉE fourni par l'utilisateur. Chaque chapitre doit explorer un aspect spécifique du sujet.
FORMAT DE SORTIE : Retourne un JSON valide. Pas de markdown, pas de code fences.`
      : `You are a professional expert author. You write high-quality books in English.

WRITING STYLE:
${toneInstruction}

LANGUAGE LEVEL:
${levelInstruction}

TARGET AUDIENCE:
${audienceInstruction}

FORMAT:
${formatInstruction}

You MUST create chapters BASED ON THE TOPIC/IDEA provided by the user. Each chapter must explore a specific aspect of the topic.
OUTPUT FORMAT: Return valid JSON. No markdown, no code fences.`;

    let userPrompt: string;

    if (singleChapter) {
      // Single chapter regeneration/amplification
      userPrompt = lang === 'fr'
        ? `${topic}

Retourne UNIQUEMENT un JSON avec cette structure :
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapitre'}", "content": "<p>Contenu HTML riche...</p>"}
  ]
}

Le contenu doit faire 400-800 mots en HTML riche (<p>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>).`
        : `${topic}

Return ONLY a JSON with this structure:
{
  "chapters": [
    {"id": "ch-1", "title": "${chapterTitle || 'Chapter'}", "content": "<p>Rich HTML content...</p>"}
  ]
}

Content should be 400-800 words in rich HTML (<p>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>).`;
    } else {
      userPrompt = lang === 'fr'
        ? `Crée un livre complet sur le sujet suivant :

TITRE : "${title}"
${topic ? `IDÉE / SUJET : ${topic}` : ''}

CONSIGNES :
- Crée exactement ${chapterCount} chapitres qui explorent différents aspects de CE sujet spécifique
- Les titres de chapitres doivent être directement liés au sujet "${topic || title}"
- Chaque chapitre doit contenir 400-600 mots de contenu riche en HTML (<p>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>)
- Le contenu doit être substantiel, informatif et unique à chaque chapitre
- Commence par une introduction et termine par une conclusion
- NE crée PAS de chapitres génériques. Tous les chapitres doivent être spécifiques au sujet donné
- Respecte le niveau de langue, le ton et le public cible définis

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
- Each chapter must contain 400-600 words of rich HTML content (<p>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote>)
- Content must be substantial, informative and unique to each chapter
- Start with an introduction and end with a conclusion
- Do NOT create generic chapters. All chapters must be specific to the given topic
- Respect the language level, tone and target audience defined

Return ONLY a JSON with this structure:
{
  "chapters": [
    {"id": "ch-1", "title": "Topic-specific title...", "content": "<p>Rich HTML content...</p>"},
    {"id": "ch-2", "title": "Topic-specific title...", "content": "<p>Rich HTML content...</p>"}
  ]
}

IMPORTANT: Each chapter must directly address the topic "${topic || title}". No generic content.`;
    }

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
