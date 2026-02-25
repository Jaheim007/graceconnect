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

    // Input validation
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!file_url || typeof file_url !== 'string' || file_url.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid file_url" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!product_id || !UUID_RE.test(product_id)) {
      return new Response(JSON.stringify({ error: "Invalid product_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (product_title && (typeof product_title !== 'string' || product_title.length > 300)) {
      return new Response(JSON.stringify({ error: "Invalid product_title" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify purchase (works for both free and paid products)
    const { data: purchase } = await adminClient
      .from("product_purchases")
      .select("id, organization_id")
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

    // Log download
    await adminClient.from("download_logs").insert({
      user_id: user.id,
      purchase_id: purchase.id,
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: req.headers.get("user-agent") || null,
    }).then(() => {}).catch(() => {});

    // Fetch the organization name
    let orgName = "Siteviral";
    if (purchase.organization_id) {
      const { data: org } = await adminClient
        .from("organizations")
        .select("name")
        .eq("id", purchase.organization_id)
        .single();
      if (org?.name) orgName = org.name;
    }

    // ── Fetch the file (handle private bucket URLs) ──
    let fileBytes: Uint8Array;
    let contentType = "application/octet-stream";

    const privateMatch = file_url.match(/\/storage\/v1\/object\/(?:public\/|)(private-products)\/(.+)$/);
    if (privateMatch) {
      const filePath = decodeURIComponent(privateMatch[2].split('?')[0]);
      console.log('[watermark-download] Downloading from private bucket:', filePath);
      const { data: blob, error: dlError } = await adminClient.storage
        .from('private-products')
        .download(filePath);
      if (dlError || !blob) {
        console.error('[watermark-download] Private download error:', dlError);
        return new Response(JSON.stringify({ error: "Could not fetch file from storage" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      fileBytes = new Uint8Array(await blob.arrayBuffer());
      contentType = blob.type || "application/octet-stream";
    } else {
      const fileRes = await fetch(file_url);
      if (!fileRes.ok) {
        console.error('[watermark-download] Public fetch failed:', fileRes.status);
        return new Response(JSON.stringify({ error: "Could not fetch file" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      contentType = fileRes.headers.get("content-type") || "application/octet-stream";
      fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    }

    const isPdf = contentType.includes("pdf") || file_url.toLowerCase().includes(".pdf");

    let outputBytes: Uint8Array;

    if (isPdf) {
      try {
        outputBytes = await watermarkPdf(fileBytes, user.email || "Unknown", product_title || "Document", orgName);
      } catch (err) {
        console.error("[watermark-download] PDF watermark failed, serving original:", err);
        outputBytes = fileBytes;
      }
    } else {
      outputBytes = fileBytes;
    }

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

// ── PDF Watermark Engine — Multi-Layer Tamper-Resistant ─────────────────────

async function watermarkPdf(
  pdfBytes: Uint8Array,
  buyerEmail: string,
  productTitle: string,
  orgName: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const licenseId = `SV-${purchaseShortId(buyerEmail, now)}`;
  const fingerprint = generateFingerprint(buyerEmail, licenseId, now);

  // Brand colors - gold accent
  const gold = rgb(0.788, 0.659, 0.298);
  const darkBg = rgb(0.07, 0.07, 0.07);

  // ── 1. License Cover Page ───────────────────────────────────────────────────
  const coverPage = pdfDoc.insertPage(0, [595, 842]); // A4
  const { width: cw, height: ch } = coverPage.getSize();

  // Header band with ORG NAME (not Siteviral)
  coverPage.drawRectangle({ x: 0, y: ch - 120, width: cw, height: 120, color: darkBg });
  coverPage.drawText(orgName, { x: 40, y: ch - 55, size: 28, font: helveticaBold, color: gold });
  coverPage.drawText("Digital License Certificate", { x: 40, y: ch - 80, size: 14, font: helvetica, color: rgb(0.8, 0.8, 0.8) });
  // Powered by line
  coverPage.drawText("Powered by Siteviral", { x: 40, y: ch - 105, size: 8, font: helveticaOblique, color: rgb(0.5, 0.5, 0.5) });

  coverPage.drawRectangle({ x: 40, y: ch - 160, width: cw - 80, height: 2, color: gold });

  const titleLines = wrapText(productTitle, 45);
  let ty = ch - 200;
  coverPage.drawText("LICENSED PRODUCT", { x: 40, y: ty, size: 10, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
  ty -= 25;
  for (const line of titleLines) {
    coverPage.drawText(line, { x: 40, y: ty, size: 20, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
    ty -= 28;
  }

  ty -= 20;
  const fields = [
    ["Licensed To", buyerEmail],
    ["Purchased From", orgName],
    ["License ID", licenseId],
    ["Date of Purchase", dateStr],
    ["License Type", "Personal Use — Non-Transferable"],
  ];

  for (const [label, value] of fields) {
    coverPage.drawText(label.toUpperCase(), { x: 40, y: ty, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
    ty -= 16;
    coverPage.drawText(value, { x: 40, y: ty, size: 13, font: helveticaBold, color: rgb(0.15, 0.15, 0.15) });
    ty -= 30;
  }

  ty -= 10;
  coverPage.drawRectangle({ x: 30, y: ty - 100, width: cw - 60, height: 110, color: rgb(0.96, 0.96, 0.96), borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 1 });

  const terms = [
    "This document is licensed for personal use only.",
    "Redistribution, resale, or sharing is strictly prohibited.",
    "This copy is watermarked and traceable to your account.",
    "Violation may result in account suspension and legal action.",
  ];

  let termY = ty - 20;
  coverPage.drawText("TERMS OF USE", { x: 45, y: termY, size: 9, font: helveticaBold, color: rgb(0.3, 0.3, 0.3) });
  termY -= 18;
  for (const t of terms) {
    coverPage.drawText(`•  ${t}`, { x: 50, y: termY, size: 9, font: helvetica, color: rgb(0.35, 0.35, 0.35) });
    termY -= 15;
  }

  // Fingerprint on cover page (hard to notice but traceable)
  coverPage.drawText(fingerprint, { x: 40, y: 55, size: 5, font: courier, color: rgb(0.88, 0.88, 0.88) });
  coverPage.drawText(`Generated on ${dateStr} — ${orgName} via Siteviral Platform`, { x: 40, y: 40, size: 8, font: helvetica, color: rgb(0.6, 0.6, 0.6) });

  // ── 2. Multi-Layer Watermarks on every content page ────────────────────────
  const pages = pdfDoc.getPages();
  const footerLine = `Licensed to: ${buyerEmail}  |  ${licenseId}  |  ${orgName}`;

  for (let i = 1; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // --- Layer 1: Large diagonal email watermark (center) ---
    page.drawText(buyerEmail, {
      x: width * 0.05, y: height * 0.30, size: 42, font: helvetica,
      color: rgb(0.85, 0.85, 0.85), opacity: 0.06, rotate: degrees(45),
    });

    // --- Layer 2: Second diagonal watermark (offset, different angle) ---
    page.drawText(licenseId, {
      x: width * 0.55, y: height * 0.65, size: 36, font: helveticaBold,
      color: rgb(0.85, 0.85, 0.85), opacity: 0.04, rotate: degrees(-35),
    });

    // --- Layer 3: Tiled micro-text grid (extremely hard to crop out) ---
    const microText = `${buyerEmail} | ${licenseId}`;
    const microSize = 4;
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 3; col++) {
        const mx = 20 + col * (width / 3);
        const my = 40 + row * ((height - 60) / 12);
        page.drawText(microText, {
          x: mx, y: my, size: microSize, font: courier,
          color: rgb(0.92, 0.92, 0.92), opacity: 0.035, rotate: degrees(25),
        });
      }
    }

    // --- Layer 4: Footer bar with license info ---
    page.drawRectangle({ x: 0, y: 0, width, height: 24, color: rgb(0.95, 0.95, 0.95), opacity: 0.92 });
    page.drawText(footerLine, { x: 10, y: 8, size: 6.5, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    // --- Layer 5: Top-right corner license ID ---
    const idWidth = helvetica.widthOfTextAtSize(licenseId, 7);
    page.drawText(licenseId, {
      x: width - idWidth - 10, y: height - 15, size: 7, font: helvetica,
      color: rgb(0.75, 0.75, 0.75), opacity: 0.45,
    });

    // --- Layer 6: Top-left org name ---
    page.drawText(orgName, {
      x: 10, y: height - 15, size: 6, font: helveticaOblique,
      color: rgb(0.8, 0.8, 0.8), opacity: 0.35,
    });

    // --- Layer 7: Hidden fingerprint in margins (forensic tracing) ---
    page.drawText(fingerprint, {
      x: 5, y: 2, size: 3, font: courier,
      color: rgb(0.97, 0.97, 0.97), opacity: 0.02,
    });
    page.drawText(fingerprint, {
      x: width - 200, y: height - 5, size: 3, font: courier,
      color: rgb(0.97, 0.97, 0.97), opacity: 0.02,
    });

    // --- Layer 8: Vertical side watermark ---
    page.drawText(buyerEmail, {
      x: 8, y: height * 0.2, size: 8, font: helvetica,
      color: rgb(0.9, 0.9, 0.9), opacity: 0.04, rotate: degrees(90),
    });
    page.drawText(licenseId, {
      x: width - 12, y: height * 0.3, size: 8, font: helvetica,
      color: rgb(0.9, 0.9, 0.9), opacity: 0.04, rotate: degrees(90),
    });
  }

  // ── 3. PDF Metadata embedding (forensic) ──────────────────────────────────
  pdfDoc.setTitle(productTitle);
  pdfDoc.setAuthor(orgName);
  pdfDoc.setSubject(`Licensed to ${buyerEmail} — ${licenseId}`);
  pdfDoc.setKeywords([licenseId, buyerEmail, orgName, 'siteviral-watermarked']);
  pdfDoc.setProducer(`Siteviral DRM v2 — ${fingerprint}`);
  pdfDoc.setCreator(`${orgName} via Siteviral`);

  return new Uint8Array(await pdfDoc.save());
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function purchaseShortId(email: string, date: Date): string {
  let hash = 0;
  const str = email + date.toISOString().slice(0, 10);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
}

/** Unique forensic fingerprint embedded invisibly in every page */
function generateFingerprint(email: string, licenseId: string, date: Date): string {
  const raw = `${email}::${licenseId}::${date.toISOString()}`;
  let h1 = 0, h2 = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    h1 = ((h1 << 5) - h1 + c) | 0;
    h2 = ((h2 << 7) + h2 + c) | 0;
  }
  return `FP-${Math.abs(h1).toString(36).toUpperCase()}-${Math.abs(h2).toString(36).toUpperCase()}-${date.getTime().toString(36).toUpperCase()}`;
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
