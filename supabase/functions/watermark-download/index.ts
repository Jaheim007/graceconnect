import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { file_url, product_id, product_title, inline } = await req.json();

    if (!file_url || !product_id) {
      return new Response(JSON.stringify({ error: "Missing file_url or product_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify purchase
    const { data: purchase } = await adminClient
      .from("product_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .eq("status", "completed")
      .limit(1)
      .single();

    if (!purchase) {
      return new Response(JSON.stringify({ error: "Purchase not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the original file
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: "Could not fetch file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";
    const fileBytes = new Uint8Array(await fileRes.arrayBuffer());

    // Build a safe ASCII filename for Content-Disposition
    const safeFilename = (product_title || "document")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\/]/g, "_");

    const ext = file_url.split('.').pop()?.split('?')[0] || 'pdf';

    // Determine disposition: inline for reading in browser, attachment for download
    const disposition = inline
      ? `inline; filename="${safeFilename}.${ext}"`
      : `attachment; filename="${safeFilename}.${ext}"`;

    // Return the ORIGINAL file bytes untouched.
    // Watermark info is conveyed via response headers only.
    // We do NOT modify the PDF binary to avoid corruption.
    const watermarkInfo = `Licensed to: ${user.email} | ${product_title || "Siteviral"}`;
    const safeWatermarkHeader = watermarkInfo.replace(/[^\x20-\x7E]/g, "_");

    return new Response(fileBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "X-Watermark": safeWatermarkHeader,
        "X-Licensed-To": (user.email || "").replace(/[^\x20-\x7E]/g, "_"),
      },
    });
  } catch (err) {
    console.error("[watermark-download] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
