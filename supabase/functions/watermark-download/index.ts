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

    // Auth check
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

    const { file_url, product_id, product_title } = await req.json();

    if (!file_url || !product_id) {
      return new Response(JSON.stringify({ error: "Missing file_url or product_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user has purchased this product
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

    // For PDF files: inject a simple text watermark into the PDF stream
    if (contentType.includes("pdf") || file_url.toLowerCase().endsWith(".pdf")) {
      const watermarkedPdf = addPdfWatermark(fileBytes, watermarkText);
      return new Response(watermarkedPdf, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(product_title || "document")}.pdf"`,
        },
      });
    }

    // For non-PDF files: return as-is with metadata header
    return new Response(fileBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(product_title || "file")}"`,
        "X-Watermark": watermarkText,
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
 * Minimal PDF watermark injection.
 * Adds a transparent text watermark on every page by appending a new content stream.
 * Works by finding each "endstream" marker on page content and injecting watermark ops.
 */
function addPdfWatermark(pdfBytes: Uint8Array, text: string): Uint8Array {
  const decoder = new TextDecoder("latin1");
  const encoder = new TextEncoder();
  let pdfStr = decoder.decode(pdfBytes);

  // Create a watermark content stream that draws diagonal text
  // We'll add it as a simple annotation approach by modifying the PDF
  // For production robustness, inject at every page's content stream end

  // Escape special PDF chars in text
  const safeText = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  // Watermark drawing operations (light gray, rotated, repeated)
  const watermarkOps = `
q
/GS0 gs
BT
/Helvetica 10 Tf
0.85 0.85 0.85 rg
1 0 0.3 1 50 50 Tm
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
0 60 Td
(${safeText}) Tj
ET
Q
`;

  // Strategy: Find all "stream" sections in page content and append watermark before "endstream"
  // This is a simplified approach that works for many PDFs
  const streamEndPattern = /endstream/g;
  let match;
  let offset = 0;
  let result = "";
  let lastIndex = 0;
  let injected = false;

  // Add ExtGState for transparency if not present
  if (!pdfStr.includes("/GS0")) {
    // Find the first Resources dict and add our graphics state
    const resourcePattern = /\/Resources\s*<<([^>]*>>[^>]*)*>>/;
    const resMatch = pdfStr.match(resourcePattern);
    if (resMatch) {
      // Add ExtGState before the closing >>
      const resEnd = pdfStr.indexOf(">>", resMatch.index! + resMatch[0].length - 2);
      if (resEnd > 0) {
        pdfStr = pdfStr.slice(0, resEnd) + " /ExtGState << /GS0 << /CA 0.15 /ca 0.15 >> >> " + pdfStr.slice(resEnd);
      }
    }
  }

  // Inject watermark ops before each endstream
  const parts = pdfStr.split("endstream");
  const finalParts: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i < parts.length - 1) {
      // Check if this looks like a content stream (contains drawing operations)
      const part = parts[i];
      if (part.includes("BT") || part.includes("Tm") || part.includes("cm") || part.includes("re")) {
        finalParts.push(part + watermarkOps + "endstream");
        injected = true;
      } else {
        finalParts.push(part + "endstream");
      }
    } else {
      finalParts.push(parts[i]);
    }
  }

  if (!injected && parts.length > 1) {
    // Fallback: inject in the first stream
    finalParts[0] = parts[0] + watermarkOps + "endstream";
    finalParts.splice(1, 1, parts[1]);
  }

  const finalStr = finalParts.join("");

  // Convert back to bytes
  const resultBytes = new Uint8Array(finalStr.length);
  for (let i = 0; i < finalStr.length; i++) {
    resultBytes[i] = finalStr.charCodeAt(i) & 0xff;
  }

  return resultBytes;
}
