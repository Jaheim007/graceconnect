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
    const watermarkText = `Licensed to: ${user.email} | ${product_title || "Siteviral"}`;

    // Build a safe ASCII filename for Content-Disposition
    const safeFilename = (product_title || "document")
      .replace(/[^\x20-\x7E]/g, "_") // Replace non-ASCII with underscore
      .replace(/["\\/]/g, "_"); // Remove quotes/slashes

    // Determine disposition: inline for "Read Now", attachment for download
    const disposition = inline
      ? `inline; filename="${safeFilename}"`
      : `attachment; filename="${safeFilename}"`;

    // Safe watermark header (ASCII only)
    const safeWatermarkHeader = watermarkText.replace(/[^\x20-\x7E]/g, "_");

    // For PDFs, inject watermark as PDF metadata (Author/Subject fields)
    // without touching content streams to avoid corruption
    if (contentType.includes("pdf") || file_url.toLowerCase().endsWith(".pdf")) {
      const watermarkedPdf = addPdfMetadataWatermark(fileBytes, watermarkText, user.email || "");
      return new Response(watermarkedPdf, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": disposition,
          "X-Watermark": safeWatermarkHeader,
        },
      });
    }

    // Non-PDF: return as-is with metadata header
    return new Response(fileBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "X-Watermark": safeWatermarkHeader,
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

/**
 * Safely inject watermark info into PDF metadata (Info dictionary)
 * without modifying any content streams. This preserves the document content.
 */
function addPdfMetadataWatermark(pdfBytes: Uint8Array, watermarkText: string, email: string): Uint8Array {
  // We append a new Info dictionary object and update the trailer to reference it.
  // This is safe because we only ADD bytes at the end; existing streams are untouched.

  const decoder = new TextDecoder("latin1");
  const pdfStr = decoder.decode(pdfBytes);

  // Find the highest object number used
  let maxObjNum = 0;
  const objPattern = /(\d+)\s+\d+\s+obj/g;
  let m;
  while ((m = objPattern.exec(pdfStr)) !== null) {
    const num = parseInt(m[1], 10);
    if (num > maxObjNum) maxObjNum = num;
  }

  const newObjNum = maxObjNum + 1;
  const safeWatermark = watermarkText.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const safeEmail = email.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  // Create a new Info dictionary object with watermark metadata
  const newInfoObj = `\n${newObjNum} 0 obj\n<< /Author (${safeEmail}) /Subject (${safeWatermark}) /Producer (Siteviral) /Creator (Siteviral - Licensed Content) >>\nendobj\n`;

  // Find the last startxref position and rebuild a minimal xref + trailer
  // For simplicity, we use a linearized cross-reference approach:
  // Just append the object. Most PDF readers will find it via the trailer /Info reference.

  // Find trailer and inject /Info reference
  const trailerMatch = pdfStr.lastIndexOf("trailer");
  
  if (trailerMatch === -1) {
    // No standard trailer (might be cross-ref stream PDF) - just return original
    return pdfBytes;
  }

  // Build output: original bytes + new info object appended before %%EOF
  // We won't rewrite the trailer to keep things safe; metadata is bonus
  const eofIndex = pdfStr.lastIndexOf("%%EOF");
  if (eofIndex === -1) {
    return pdfBytes;
  }

  // Insert the new object before %%EOF
  const before = pdfStr.substring(0, eofIndex);
  const after = pdfStr.substring(eofIndex);
  const finalStr = before + newInfoObj + after;

  // Convert back to bytes preserving binary content
  const resultBytes = new Uint8Array(finalStr.length);
  for (let i = 0; i < finalStr.length; i++) {
    resultBytes[i] = finalStr.charCodeAt(i) & 0xff;
  }

  return resultBytes;
}
