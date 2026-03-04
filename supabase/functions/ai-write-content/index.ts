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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Clé API Gemini non configurée." }), {
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

FORMAT DE SORTIE: Tu DOIS retourner du HTML propre et bien formaté. PAS de markdown.

Règles:
- Rédige en français
- Utilise des phrases courtes et impactantes
- Ajoute des emojis pertinents
- Structure avec des paragraphes <p>
- Mets les mots importants en <strong>gras</strong>
- Utilise <em> pour l'italique quand pertinent
- Utilise <br> pour les sauts de ligne dans un paragraphe
- Le texte doit être du HTML prêt à être inséré dans un éditeur
- Maximum 300 mots
- IMPORTANT: Ne commence JAMAIS par une phrase d'introduction comme "Voici une description..." ou "Voici un texte..."
- IMPORTANT: Ne mets JAMAIS de séparateurs comme "---" ou "<hr>" au début ou à la fin
- IMPORTANT: N'utilise JAMAIS de markdown (pas de ** ni de * ni de #). Uniquement du HTML.
- IMPORTANT: N'enveloppe PAS le résultat dans des balises \`\`\`html ou \`\`\`
- Va droit au but, commence directement par le contenu demandé`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erreur du service Gemini." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
