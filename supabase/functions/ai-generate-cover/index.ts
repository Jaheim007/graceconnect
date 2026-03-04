import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, style = "professional", format = "book", context = "product", include_text = true } = await req.json();

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

    const styleMap: Record<string, string> = {
      professional: "clean, professional, modern design with subtle gradients and elegant typography",
      vibrant: "vibrant, colorful, eye-catching design with bold colors and dynamic composition",
      minimalist: "minimalist, clean white space, simple geometric shapes, modern typography",
      creative: "creative, artistic, unique design with abstract elements and artistic flair",
      religious: "spiritual, serene, warm golden tones, dove or cross motifs, peaceful atmosphere",
    };

    const formatMap: Record<string, string> = {
      book: "portrait orientation, book cover aspect ratio 2:3, 1000x1500 pixels",
      video: "landscape orientation, 16:9 aspect ratio, 1920x1080 pixels",
      square: "square format, 1:1 aspect ratio, 1080x1080 pixels",
    };

    const textInstruction = include_text
      ? "Include a clear, well-designed title text on the cover that matches the theme. The text must be perfectly spelled with ZERO typos or errors. Double-check every letter. Use professional, legible typography."
      : "Do NOT include ANY text, words, letters, or typography on the image. Use only visual elements, illustrations, patterns, and colors.";

    const imagePrompt = `Create a professional ${context} cover image. ${styleMap[style] || styleMap.professional}. ${formatMap[format] || formatMap.book}. Theme/subject: ${prompt}. The design should be suitable for an African digital marketplace. ${textInstruction} High quality, polished, ready for commercial use.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini image error:", response.status, t);
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

    // Extract inline image from Gemini response
    const parts = data.candidates?.[0]?.content?.parts || [];
    let imageBase64: string | null = null;
    let imageMimeType = "image/png";

    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "L'IA n'a pas pu générer d'image. Réessayez avec un prompt différent." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload the image to Supabase storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const ext = imageMimeType.includes("jpeg") ? "jpg" : "png";
    const fileName = `ai-covers/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(fileName, bytes, { contentType: imageMimeType, upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Fallback: return the base64 directly
      return new Response(JSON.stringify({ imageUrl: `data:${imageMimeType};base64,${imageBase64}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage
      .from("public-assets")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({ imageUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate-cover error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur interne." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
