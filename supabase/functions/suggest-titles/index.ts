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

    const { topic, style, audience, language } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'topic required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = language === 'en' ? 'en' : language === 'es' ? 'es' : language === 'pt' ? 'pt' : language === 'de' ? 'de' : language === 'sw' ? 'sw' : 'fr';

    const prompt = lang === 'fr'
      ? `Tu es un éditeur expert en titres de bestsellers. Propose exactement 3 titres percutants, créatifs et vendeurs pour un livre sur ce sujet :

Sujet : "${topic}"
Style : ${style || 'ebook'}
Public : ${audience || 'général'}

Règles :
- Titres courts (3-8 mots max)
- Percutants, mémorables, qui donnent envie de lire
- Variés : un provocateur, un promesse claire, un intrigant
- En français

Retourne UNIQUEMENT un JSON : {"titles": ["Titre 1", "Titre 2", "Titre 3"]}`
      : `You are an expert bestseller title editor. Suggest exactly 3 punchy, creative, marketable titles for a book on this topic:

Topic: "${topic}"
Style: ${style || 'ebook'}
Audience: ${audience || 'general'}

Rules:
- Short titles (3-8 words max)
- Punchy, memorable, makes you want to read
- Varied: one provocative, one clear promise, one intriguing
- In ${lang}

Return ONLY JSON: {"titles": ["Title 1", "Title 2", "Title 3"]}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Return ONLY valid JSON. No markdown, no code fences.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit. Please retry.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: `AI error (${aiRes.status})` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);

    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed?.titles)) {
        return new Response(JSON.stringify({ titles: parsed.titles.slice(0, 3) }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {}

    return new Response(JSON.stringify({ error: 'Failed to parse titles' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('suggest-titles error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
