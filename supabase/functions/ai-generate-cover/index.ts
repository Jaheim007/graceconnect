import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { product_id, title, product_type, description } = await req.json();
    if (!product_id || !title) throw new Error("Missing product_id or title");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build prompt
    const typeHints: Record<string, string> = {
      pdf: "a professional PDF document cover",
      ebook: "an elegant e-book cover",
      audio: "a modern audio content cover with headphones/sound waves",
      video: "a cinematic video thumbnail",
      course: "a professional course/training cover",
      link: "a clean digital resource cover",
    };
    const typeHint = typeHints[product_type || ""] || "a professional digital product cover";
    const shortDesc = (description || "").slice(0, 200);

    const prompt = `Create ${typeHint} design for a digital product titled "${title}". ${shortDesc ? `The product is about: ${shortDesc}.` : ""} Style: modern, clean, professional, vibrant colors, high contrast text-free design suitable as a product cover image. Aspect ratio 2:3 portrait. Ultra high resolution.`;

    // Call AI image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errText.slice(0, 200)}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.data?.[0]?.url;
    const imageBase64 = aiData.data?.[0]?.b64_json
      ? `data:image/png;base64,${aiData.data[0].b64_json}`
      : null;

    if (!imageUrl && !imageBase64) throw new Error("No image generated");

    let imageBytes: Uint8Array;

    if (imageBase64) {
      // Handle base64 response
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    } else {
      // Handle URL response - download the image
      const imgResp = await fetch(imageUrl!);
      if (!imgResp.ok) throw new Error("Failed to download generated image");
      const arrBuf = await imgResp.arrayBuffer();
      imageBytes = new Uint8Array(arrBuf);
    }

    const fileName = `ai-covers/${product_id}-${Date.now()}.png`;

    const { error: uploadErr } = await supabase.storage
      .from("org-uploads")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: urlData } = supabase.storage
      .from("org-uploads")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    return new Response(
      JSON.stringify({ ok: true, cover_url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
