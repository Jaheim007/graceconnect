import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * ai-generate-snippets — Auto-generates viral content snippets from a published product.
 * Creates quotes, social descriptions, and shareable text from product data.
 * Called after publication to populate viral_snippets table.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { product_id, org_id } = await req.json();
    if (!product_id || !org_id) {
      return new Response(JSON.stringify({ error: "product_id and org_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch product details
    const { data: product, error: pErr } = await supabase
      .from("digital_products")
      .select("title, description, product_type, price, currency, cover_image_url")
      .eq("id", product_id)
      .eq("organization_id", org_id)
      .single();

    if (pErr || !product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch org details
    const { data: org } = await supabase
      .from("organizations")
      .select("name, slug")
      .eq("id", org_id)
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: generate basic snippets without AI
      const snippets = generateFallbackSnippets(product, org);
      await saveSnippets(supabase, product_id, org_id, snippets);
      return new Response(JSON.stringify({ ok: true, count: snippets.length, method: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to generate viral snippets
    const prompt = `Tu es un expert en marketing viral. Génère des extraits partageables pour ce produit numérique.

Produit: "${product.title}"
Description: ${product.description || "Non fournie"}
Type: ${product.product_type || "ebook"}
Créateur: ${org?.name || "Créateur"}

Génère exactement 10 éléments viraux au format JSON array. Chaque élément doit avoir:
- "type": "quote" | "hook" | "benefit" | "social_post" 
- "text": le texte (max 280 chars pour social_post, max 150 pour quote/hook/benefit)
- "platform": "whatsapp" | "facebook" | "twitter" | "instagram" | "universal"

Priorités:
- 3 citations/extraits percutants (quote)
- 3 accroches virales (hook) 
- 2 bénéfices clés (benefit)
- 2 posts sociaux prêts à publier (social_post)

Réponds UNIQUEMENT avec le JSON array, sans markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Tu génères du contenu marketing viral en français. Réponds uniquement en JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status);
      // Fallback
      const snippets = generateFallbackSnippets(product, org);
      await saveSnippets(supabase, product_id, org_id, snippets);
      return new Response(JSON.stringify({ ok: true, count: snippets.length, method: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Clean markdown fences
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let aiSnippets: any[];
    try {
      aiSnippets = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      aiSnippets = generateFallbackSnippets(product, org);
    }

    await saveSnippets(supabase, product_id, org_id, aiSnippets);

    return new Response(JSON.stringify({ ok: true, count: aiSnippets.length, method: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Snippet generation error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateFallbackSnippets(product: any, org: any) {
  const title = product.title;
  const creator = org?.name || "Créateur";
  return [
    { type: "hook", text: `Découvrez "${title}" — le contenu qui fait le buzz ! 🔥`, platform: "universal" },
    { type: "quote", text: `"${title}" par ${creator} — un contenu à ne pas manquer.`, platform: "universal" },
    { type: "benefit", text: `${title} — Accédez à un contenu premium conçu pour transformer votre quotidien.`, platform: "universal" },
    { type: "social_post", text: `🚀 Je viens de découvrir "${title}" sur Siteviral. Incroyable ! À partager sans modération.`, platform: "whatsapp" },
    { type: "social_post", text: `📚 "${title}" par ${creator} — Un contenu de qualité disponible maintenant. #Siteviral #ContenuDigital`, platform: "twitter" },
  ];
}

async function saveSnippets(supabase: any, productId: string, orgId: string, snippets: any[]) {
  // Use service role for insert
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Delete existing snippets for this product
  await adminClient.from("viral_snippets").delete().eq("product_id", productId);

  // Insert new ones
  const rows = snippets.map((s: any, i: number) => ({
    product_id: productId,
    organization_id: orgId,
    snippet_type: s.type || "quote",
    text: s.text,
    platform: s.platform || "universal",
    display_order: i,
  }));

  const { error } = await adminClient.from("viral_snippets").insert(rows);
  if (error) {
    console.error("Failed to save snippets:", error);
  }
}
