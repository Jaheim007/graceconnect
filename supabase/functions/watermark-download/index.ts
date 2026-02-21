import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb, StandardFonts, degrees } from "https://esm.sh/pdf-lib@1.17.1";

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

    // Only watermark PDFs
    const isPdf = contentType.includes("pdf") || file_url.toLowerCase().includes(".pdf");

    let outputBytes: Uint8Array;

    if (isPdf) {
      try {
        outputBytes = await watermarkPdf(fileBytes, user.email || "Unknown", product_title || "Document");
      } catch (err) {
        console.error("[watermark-download] PDF watermark failed, serving original:", err);
        outputBytes = fileBytes;
      }
    } else {
      outputBytes = fileBytes;
    }

    // Build a safe ASCII filename
    const safeTitle = (product_title || "document")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\/]/g, "_")
      .substring(0, 60);
    const ext = file_url.split('.').pop()?.split('?')[0] || 'pdf';

    const disposition = inline
      ? `inline; filename="${safeTitle}.${ext}"`
      : `attachment; filename="${safeTitle}.${ext}"`;

    return new Response(outputBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": isPdf ? "application/pdf" : contentType,
        "Content-Disposition": disposition,
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

// ── PDF Watermark Engine ──────────────────────────────────────────────────────

async function watermarkPdf(
  pdfBytes: Uint8Array,
  buyerEmail: string,
  productTitle: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const licenseId = `SV-${purchase_short_id(buyerEmail, now)}`;

  // ── 1. Add a License Cover Page as the FIRST page ──────────────────────────
  const coverPage = pdfDoc.insertPage(0, [595, 842]); // A4
  const { width: cw, height: ch } = coverPage.getSize();

  // Background header bar
  coverPage.drawRectangle({
    x: 0, y: ch - 120, width: cw, height: 120,
    color: rgb(0.07, 0.07, 0.07),
  });

  // Brand
  coverPage.drawText("SITEVIRAL", {
    x: 40, y: ch - 50, size: 28, font: helveticaBold,
    color: rgb(0.788, 0.659, 0.298), // gold #c9a84c
  });

  coverPage.drawText("Digital License Certificate", {
    x: 40, y: ch - 80, size: 14, font: helvetica,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Divider line
  coverPage.drawRectangle({
    x: 40, y: ch - 160, width: cw - 80, height: 2,
    color: rgb(0.788, 0.659, 0.298),
  });

  // Product title
  const titleLines = wrapText(productTitle, 45);
  let ty = ch - 200;
  coverPage.drawText("LICENSED PRODUCT", {
    x: 40, y: ty, size: 10, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });
  ty -= 25;
  for (const line of titleLines) {
    coverPage.drawText(line, {
      x: 40, y: ty, size: 20, font: helveticaBold, color: rgb(0.1, 0.1, 0.1),
    });
    ty -= 28;
  }

  // License details
  ty -= 20;
  const fields = [
    ["Licensed To", buyerEmail],
    ["License ID", licenseId],
    ["Date of Purchase", dateStr],
    ["License Type", "Personal Use — Non-Transferable"],
  ];

  for (const [label, value] of fields) {
    coverPage.drawText(label.toUpperCase(), {
      x: 40, y: ty, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5),
    });
    ty -= 16;
    coverPage.drawText(value, {
      x: 40, y: ty, size: 13, font: helveticaBold, color: rgb(0.15, 0.15, 0.15),
    });
    ty -= 30;
  }

  // Terms box
  ty -= 10;
  coverPage.drawRectangle({
    x: 30, y: ty - 100, width: cw - 60, height: 110,
    color: rgb(0.96, 0.96, 0.96),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });

  const terms = [
    "This document is licensed for personal use only.",
    "Redistribution, resale, or sharing is strictly prohibited.",
    "This copy is watermarked and traceable to your account.",
    "Violation may result in account suspension and legal action.",
  ];

  let termY = ty - 20;
  coverPage.drawText("TERMS OF USE", {
    x: 45, y: termY, size: 9, font: helveticaBold, color: rgb(0.3, 0.3, 0.3),
  });
  termY -= 18;
  for (const t of terms) {
    coverPage.drawText(`•  ${t}`, {
      x: 50, y: termY, size: 9, font: helvetica, color: rgb(0.35, 0.35, 0.35),
    });
    termY -= 15;
  }

  // Footer
  coverPage.drawText(`Generated on ${dateStr} — Siteviral Platform`, {
    x: 40, y: 40, size: 8, font: helvetica, color: rgb(0.6, 0.6, 0.6),
  });

  // ── 2. Watermark every content page ────────────────────────────────────────
  const pages = pdfDoc.getPages();
  const watermarkLine = `Licensed to: ${buyerEmail}  |  ${licenseId}`;

  for (let i = 1; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Diagonal watermark across the page (subtle)
    page.drawText(buyerEmail, {
      x: width * 0.1,
      y: height * 0.35,
      size: 38,
      font: helvetica,
      color: rgb(0.85, 0.85, 0.85),
      opacity: 0.08,
      rotate: degrees(45),
    });

    // Bottom footer bar
    page.drawRectangle({
      x: 0, y: 0, width, height: 22,
      color: rgb(0.95, 0.95, 0.95),
      opacity: 0.9,
    });

    page.drawText(watermarkLine, {
      x: 10,
      y: 7,
      size: 7,
      font: helvetica,
      color: rgb(0.55, 0.55, 0.55),
    });

    // Top-right corner license ID
    const idWidth = helvetica.widthOfTextAtSize(licenseId, 7);
    page.drawText(licenseId, {
      x: width - idWidth - 10,
      y: height - 15,
      size: 7,
      font: helvetica,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.5,
    });
  }

  return new Uint8Array(await pdfDoc.save());
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function purchase_short_id(email: string, date: Date): string {
  let hash = 0;
  const str = email + date.toISOString().slice(0, 10);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}
