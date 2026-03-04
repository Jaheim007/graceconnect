import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, tone = "professional", context = "description" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Le champ 'prompt' est requis." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Clé API IA non configurée." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toneInstructions: Record<string, string> = {
      professional: "Utilise un ton professionnel, clair et structuré.",
      friendly: "Utilise un ton amical, chaleureux et accessible.",
      inspiring: "Utilise un ton inspirant, motivant et enthousiaste.",
      persuasive: "Utilise un ton persuasif, vendeur et convaincant avec des arguments forts.",
      educational: "Utilise un ton pédagogique, didactique et facile à comprendre.",
    };

    const systemPrompt = `Tu es un rédacteur expert en marketing digital pour une plateforme africaine de vente de produits numériques. Tu rédiges des textes en français, percutants et adaptés au contexte africain.

Contexte: Tu rédiges une ${context}.
${toneInstructions[tone] || toneInstructions.professional}

Règles:
- Rédige en français
- Utilise des phrases courtes et impactantes
- Ajoute des emojis pertinents
- Structure avec des paragraphes clairs
- Mets les mots importants en **gras**
- Le texte doit être prêt à être copié-collé
- Maximum 300 mots
- IMPORTANT: Ne commence JAMAIS par une phrase d'introduction comme "Voici une description..." ou "Voici un texte..."
- IMPORTANT: Ne mets JAMAIS de séparateurs comme "---" au début ou à la fin du texte
- Va droit au but, commence directement par le contenu demandé`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Contactez le support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-write-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur interne." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
