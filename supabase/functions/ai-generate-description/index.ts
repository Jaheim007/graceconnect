import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { title, product_type, price, currency, language } = await req.json();

    if (!title || title.length < 3) {
      return new Response(JSON.stringify({ error: 'Title is required (min 3 chars)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isFr = language === 'fr';
    const priceText = price > 0 ? `${price} ${currency || 'XOF'}` : (isFr ? 'Gratuit' : 'Free');

    const prompt = isFr
      ? `Tu es un expert en copywriting de vente pour des produits digitaux africains. Écris une description de vente HTML compelling pour le produit suivant:

Titre: "${title}"
Type: ${product_type}
Prix: ${priceText}

Règles:
- Écris en français africain naturel (pas de français de France guindé)
- Utilise des emojis avec parcimonie (2-3 max)
- Structure avec des paragraphes HTML <p>, <strong>, <ul><li>
- Commence par un accroche forte qui décrit le bénéfice principal
- Mentionne 3-4 bénéfices clés en bullet points
- Termine par un appel à l'action
- 150-250 mots maximum
- N'inclus PAS de titre H1/H2 (le titre est déjà affiché)
- Sois concret et orienté résultat`
      : `You are a sales copywriting expert for digital products. Write a compelling HTML sales description for:

Title: "${title}"
Type: ${product_type}
Price: ${priceText}

Rules:
- Write in natural, engaging English
- Use emojis sparingly (2-3 max)
- Structure with HTML <p>, <strong>, <ul><li>
- Start with a strong hook about the main benefit
- Include 3-4 key benefits as bullet points
- End with a call to action
- 150-250 words max
- Do NOT include H1/H2 headings (title is shown separately)
- Be concrete and results-oriented`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", errText);
      throw new Error("AI generation failed");
    }

    const result = await response.json();
    let description = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up markdown artifacts
    description = description
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
