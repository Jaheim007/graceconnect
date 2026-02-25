import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb, StandardFonts, degrees } from "https://esm.sh/pdf-lib@1.17.1";
import { zipSync, unzipSync } from "https://esm.sh/fflate@0.8.2";

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

    // Verify purchase
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

    // Fetch org name
    let orgName = "Platform";
    if (purchase.organization_id) {
      const { data: org } = await adminClient
        .from("organizations")
        .select("name")
        .eq("id", purchase.organization_id)
        .single();
      if (org?.name) orgName = org.name;
    }

    // ── Fetch the file ──
    let fileBytes: Uint8Array;
    let contentType = "application/octet-stream";

    const privateMatch = file_url.match(/\/storage\/v1\/object\/(?:public\/|)(private-products)\/(.+)$/);
    if (privateMatch) {
      const filePath = decodeURIComponent(privateMatch[2].split('?')[0]);
      const { data: blob, error: dlError } = await adminClient.storage
        .from('private-products')
        .download(filePath);
      if (dlError || !blob) {
        return new Response(JSON.stringify({ error: "Could not fetch file from storage" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      fileBytes = new Uint8Array(await blob.arrayBuffer());
      contentType = blob.type || "application/octet-stream";
    } else {
      const fileRes = await fetch(file_url);
      if (!fileRes.ok) {
        return new Response(JSON.stringify({ error: "Could not fetch file" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      contentType = fileRes.headers.get("content-type") || "application/octet-stream";
      fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    }

    const urlLower = file_url.toLowerCase();
    const isPdf = contentType.includes("pdf") || urlLower.includes(".pdf");
    const isDocx = contentType.includes("wordprocessingml") || urlLower.includes(".docx");
    const isPptx = contentType.includes("presentationml") || urlLower.includes(".pptx");

    const buyerEmail = user.email || "Unknown";
    const title = product_title || "Document";
    const safeTitle = title.replace(/[^\x20-\x7E]/g, "_").replace(/["\\/]/g, "_").substring(0, 60);

    const now = new Date();
    const licenseId = `SV-${purchaseShortId(buyerEmail, now)}`;

    if (isPdf) {
      let outputBytes: Uint8Array;
      try {
        outputBytes = await watermarkPdf(fileBytes, buyerEmail, title, orgName);
      } catch (err) {
        console.error("[watermark-download] PDF watermark failed:", err);
        outputBytes = fileBytes;
      }
      const disposition = inline
        ? `inline; filename="${safeTitle}.pdf"`
        : `attachment; filename="${safeTitle}.pdf"`;
      return new Response(outputBytes, {
        headers: { ...corsHeaders, "Content-Type": "application/pdf", "Content-Disposition": disposition },
      });

    } else if (isDocx) {
      let outputBytes: Uint8Array;
      try {
        outputBytes = watermarkDocx(fileBytes, buyerEmail, orgName, licenseId);
      } catch (err) {
        console.error("[watermark-download] DOCX watermark failed:", err);
        outputBytes = fileBytes;
      }
      return new Response(outputBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
        },
      });

    } else if (isPptx) {
      let outputBytes: Uint8Array;
      try {
        outputBytes = watermarkPptx(fileBytes, buyerEmail, orgName, licenseId);
      } catch (err) {
        console.error("[watermark-download] PPTX watermark failed:", err);
        outputBytes = fileBytes;
      }
      return new Response(outputBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${safeTitle}.pptx"`,
        },
      });

    } else {
      // Other file types — serve directly (no ZIP)
      const ext = file_url.split('.').pop()?.split('?')[0] || 'bin';
      return new Response(fileBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
        },
      });
    }
  } catch (err) {
    console.error("[watermark-download] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DOCX Watermark — Injects diagonal email watermark + license footer
// ══════════════════════════════════════════════════════════════════════════════

function watermarkDocx(
  docxBytes: Uint8Array,
  buyerEmail: string,
  orgName: string,
  licenseId: string,
): Uint8Array {
  const files = unzipSync(docxBytes);
  const dec = new TextDecoder();
  const enc = new TextEncoder();

  // Find next available header/footer numbers
  let headerNum = 1;
  while (files[`word/header${headerNum}.xml`]) headerNum++;
  let footerNum = 1;
  while (files[`word/footer${footerNum}.xml`]) footerNum++;

  const headerPath = `word/header${headerNum}.xml`;
  const footerPath = `word/footer${footerNum}.xml`;

  // Create watermark header with diagonal email
  files[headerPath] = enc.encode(buildDocxWatermarkHeader(buyerEmail));

  // Create license footer
  const footerText = `Licensed to: ${buyerEmail}  |  ${licenseId}  |  ${orgName}`;
  files[footerPath] = enc.encode(buildDocxFooter(footerText));

  // Update [Content_Types].xml
  const ctKey = Object.keys(files).find(k => k === '[Content_Types].xml') || '[Content_Types].xml';
  if (files[ctKey]) {
    let ct = dec.decode(files[ctKey]);
    if (!ct.includes(`/word/header${headerNum}.xml`)) {
      ct = ct.replace('</Types>',
        `<Override PartName="/word/header${headerNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>` +
        `<Override PartName="/word/footer${footerNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` +
        `</Types>`
      );
      files[ctKey] = enc.encode(ct);
    }
  }

  // Update word/_rels/document.xml.rels
  const relsKey = Object.keys(files).find(k => k.includes('word/_rels/document.xml.rels')) || 'word/_rels/document.xml.rels';
  const hRelId = `rIdWmH${headerNum}`;
  const fRelId = `rIdWmF${footerNum}`;

  if (files[relsKey]) {
    let rels = dec.decode(files[relsKey]);
    rels = rels.replace('</Relationships>',
      `<Relationship Id="${hRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header${headerNum}.xml"/>` +
      `<Relationship Id="${fRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer${footerNum}.xml"/>` +
      `</Relationships>`
    );
    files[relsKey] = enc.encode(rels);
  }

  // Update word/document.xml — add header/footer refs to sectPr
  const docKey = Object.keys(files).find(k => k.includes('word/document.xml') && !k.includes('rels')) || 'word/document.xml';
  if (files[docKey]) {
    let doc = dec.decode(files[docKey]);
    const headerRef = `<w:headerReference w:type="default" r:id="${hRelId}"/>`;
    const footerRef = `<w:footerReference w:type="default" r:id="${fRelId}"/>`;

    // Remove existing default header/footer references to avoid conflicts
    doc = doc.replace(/<w:headerReference\s+w:type\s*=\s*"default"[^/]*\/>/g, '');
    doc = doc.replace(/<w:footerReference\s+w:type\s*=\s*"default"[^/]*\/>/g, '');

    if (doc.includes('<w:sectPr')) {
      doc = doc.replace(/(<w:sectPr[^>]*>)/, `$1${headerRef}${footerRef}`);
    } else {
      // No sectPr — add one before closing body tag
      doc = doc.replace('</w:body>', `<w:sectPr>${headerRef}${footerRef}</w:sectPr></w:body>`);
    }
    files[docKey] = enc.encode(doc);
  }

  return zipSync(files);
}

function buildDocxWatermarkHeader(watermarkText: string): string {
  const escaped = watermarkText.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
       xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
       xmlns:o="urn:schemas-microsoft-com:office:office"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:v="urn:schemas-microsoft-com:vml"
       xmlns:w10="urn:schemas-microsoft-com:office:word"
       xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       mc:Ignorable="w14 wp14">
  <w:p>
    <w:pPr><w:pStyle w:val="Header"/></w:pPr>
    <w:r>
      <w:rPr><w:noProof/></w:rPr>
      <w:pict>
        <v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800"
          path="m@7,l@8,m@5,21600l@6,21600e">
          <v:formulas>
            <v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/>
            <v:f eqn="sum 21600 0 @1"/><v:f eqn="sum 0 0 @2"/>
            <v:f eqn="sum 21600 0 @3"/><v:f eqn="if @0 @3 0"/>
            <v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/>
            <v:f eqn="if @0 @4 21600"/><v:f eqn="mid @5 @6"/>
            <v:f eqn="mid @8 @5"/><v:f eqn="mid @7 @8"/>
            <v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/>
          </v:formulas>
          <v:path textpathok="t" o:connecttype="custom"
            o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800"
            o:connectangles="270,180,90,0"/>
          <v:textpath on="t" fitshape="t"/>
          <v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles>
          <o:lock v:ext="edit" text="t" shapetype="t"/>
        </v:shapetype>
        <v:shape id="PowerPlusWaterMarkObject" o:spid="_x0000_s2049"
          type="#_x0000_t136"
          style="position:absolute;margin-left:0;margin-top:0;width:494.25pt;height:86.25pt;rotation:315;z-index:-251658752;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin"
          o:allowincell="f" fillcolor="#2563EB" stroked="f">
          <v:fill opacity=".14"/>
          <v:textpath style="font-family:&quot;Arial&quot;;font-size:1pt" string="${escaped}"/>
        </v:shape>
      </w:pict>
    </w:r>
  </w:p>
</w:hdr>`;
}

function buildDocxFooter(footerText: string): string {
  const escaped = footerText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr><w:pStyle w:val="Footer"/><w:jc w:val="center"/></w:pPr>
    <w:r>
      <w:rPr><w:sz w:val="14"/><w:szCs w:val="14"/><w:color w:val="8899AA"/></w:rPr>
      <w:t xml:space="preserve">${escaped}</w:t>
    </w:r>
  </w:p>
</w:ftr>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// PPTX Watermark — Injects diagonal email text on every slide
// ══════════════════════════════════════════════════════════════════════════════

function watermarkPptx(
  pptxBytes: Uint8Array,
  buyerEmail: string,
  orgName: string,
  licenseId: string,
): Uint8Array {
  const files = unzipSync(pptxBytes);
  const dec = new TextDecoder();
  const enc = new TextEncoder();

  const watermarkShape = buildPptxWatermarkShape(buyerEmail);
  const footerShape = buildPptxFooterShape(`Licensed to: ${buyerEmail}  |  ${licenseId}  |  ${orgName}`);

  // Find all slide XML files
  const slideKeys = Object.keys(files).filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k)).sort();

  for (const slideKey of slideKeys) {
    let slideXml = dec.decode(files[slideKey]);

    // Insert watermark shapes after </p:grpSpPr> (first shapes in tree = behind content)
    if (slideXml.includes('</p:grpSpPr>')) {
      slideXml = slideXml.replace('</p:grpSpPr>', `</p:grpSpPr>${watermarkShape}${footerShape}`);
    } else if (slideXml.includes('</p:spTree>')) {
      // Fallback: add before closing spTree
      slideXml = slideXml.replace('</p:spTree>', `${watermarkShape}${footerShape}</p:spTree>`);
    }

    files[slideKey] = enc.encode(slideXml);
  }

  return zipSync(files);
}

function buildPptxWatermarkShape(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Rotation: -45 degrees = -2700000 (60000ths of degree)
  // Position: centered on a standard slide (9144000 x 6858000 EMUs)
  return `<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="99990" name="WatermarkDiag"/>
    <p:cNvSpPr txBox="1"/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm rot="-2700000">
      <a:off x="800000" y="2500000"/>
      <a:ext cx="7500000" cy="1800000"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/><a:ln><a:noFill/></a:ln>
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" rtlCol="0" anchor="ctr"/>
    <a:lstStyle/>
    <a:p>
      <a:pPr algn="ctr"/>
      <a:r>
        <a:rPr lang="en-US" sz="3600" dirty="0">
          <a:solidFill><a:srgbClr val="2563EB"><a:alpha val="14000"/></a:srgbClr></a:solidFill>
          <a:latin typeface="Arial"/>
        </a:rPr>
        <a:t>${escaped}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>`;
}

function buildPptxFooterShape(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Bottom of standard slide
  return `<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="99991" name="WatermarkFooter"/>
    <p:cNvSpPr txBox="1"/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="300000" y="6400000"/>
      <a:ext cx="8600000" cy="350000"/>
    </a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    <a:noFill/><a:ln><a:noFill/></a:ln>
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" rtlCol="0" anchor="b"/>
    <a:lstStyle/>
    <a:p>
      <a:pPr algn="ctr"/>
      <a:r>
        <a:rPr lang="en-US" sz="700" dirty="0">
          <a:solidFill><a:srgbClr val="8899AA"/></a:solidFill>
          <a:latin typeface="Arial"/>
        </a:rPr>
        <a:t>${escaped}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// PDF Watermark Engine — Multi-Layer Tamper-Resistant
// ══════════════════════════════════════════════════════════════════════════════

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

  const brandBlue = rgb(0.145, 0.388, 0.922); // #2563EB
  const darkBg = rgb(0.07, 0.07, 0.12);

  // ── 1. License Cover Page ──
  const coverPage = pdfDoc.insertPage(0, [595, 842]);
  const { width: cw, height: ch } = coverPage.getSize();

  coverPage.drawRectangle({ x: 0, y: ch - 120, width: cw, height: 120, color: darkBg });
  coverPage.drawText(orgName, { x: 40, y: ch - 55, size: 28, font: helveticaBold, color: brandBlue });
  coverPage.drawText("Digital License Certificate", { x: 40, y: ch - 80, size: 14, font: helvetica, color: rgb(0.8, 0.8, 0.8) });

  coverPage.drawRectangle({ x: 40, y: ch - 160, width: cw - 80, height: 2, color: brandBlue });

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

  coverPage.drawText(fingerprint, { x: 40, y: 55, size: 5, font: courier, color: rgb(0.88, 0.88, 0.88) });
  coverPage.drawText(`Generated on ${dateStr} — ${orgName}`, { x: 40, y: 40, size: 8, font: helvetica, color: rgb(0.6, 0.6, 0.6) });

  // ── 2. Multi-Layer Watermarks on every content page ──
  const pages = pdfDoc.getPages();
  const footerLine = `Licensed to: ${buyerEmail}  |  ${licenseId}  |  ${orgName}`;

  for (let i = 1; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Layer 1: Large diagonal email
    page.drawText(buyerEmail, {
      x: width * 0.05, y: height * 0.30, size: 42, font: helvetica,
      color: rgb(0.15, 0.39, 0.92), opacity: 0.07, rotate: degrees(45),
    });

    // Layer 2: License ID diagonal (offset)
    page.drawText(licenseId, {
      x: width * 0.55, y: height * 0.65, size: 36, font: helveticaBold,
      color: rgb(0.15, 0.39, 0.92), opacity: 0.05, rotate: degrees(-35),
    });

    // Layer 3: Tiled micro-text grid
    const microText = `${buyerEmail} | ${licenseId}`;
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 3; col++) {
        page.drawText(microText, {
          x: 20 + col * (width / 3), y: 40 + row * ((height - 60) / 12),
          size: 4, font: courier, color: rgb(0.15, 0.39, 0.92), opacity: 0.035, rotate: degrees(25),
        });
      }
    }

    // Layer 4: Footer bar
    page.drawRectangle({ x: 0, y: 0, width, height: 24, color: rgb(0.95, 0.95, 0.97), opacity: 0.92 });
    page.drawText(footerLine, { x: 10, y: 8, size: 6.5, font: helvetica, color: rgb(0.4, 0.45, 0.55) });

    // Layer 5: Top-right license ID
    const idWidth = helvetica.widthOfTextAtSize(licenseId, 7);
    page.drawText(licenseId, {
      x: width - idWidth - 10, y: height - 15, size: 7, font: helvetica,
      color: rgb(0.6, 0.65, 0.75), opacity: 0.45,
    });

    // Layer 6: Top-left org name
    page.drawText(orgName, {
      x: 10, y: height - 15, size: 6, font: helveticaOblique,
      color: rgb(0.6, 0.65, 0.75), opacity: 0.35,
    });

    // Layer 7: Hidden forensic fingerprints
    page.drawText(fingerprint, { x: 5, y: 2, size: 3, font: courier, color: rgb(0.97, 0.97, 0.97), opacity: 0.02 });
    page.drawText(fingerprint, { x: width - 200, y: height - 5, size: 3, font: courier, color: rgb(0.97, 0.97, 0.97), opacity: 0.02 });

    // Layer 8: Vertical side watermarks
    page.drawText(buyerEmail, { x: 8, y: height * 0.2, size: 8, font: helvetica, color: rgb(0.15, 0.39, 0.92), opacity: 0.04, rotate: degrees(90) });
    page.drawText(licenseId, { x: width - 12, y: height * 0.3, size: 8, font: helvetica, color: rgb(0.15, 0.39, 0.92), opacity: 0.04, rotate: degrees(90) });
  }

  // ── 3. PDF Metadata ──
  pdfDoc.setTitle(productTitle);
  pdfDoc.setAuthor(orgName);
  pdfDoc.setSubject(`Licensed to ${buyerEmail} — ${licenseId}`);
  pdfDoc.setKeywords([licenseId, buyerEmail, orgName, 'watermarked']);
  pdfDoc.setProducer(`${orgName} DRM — ${fingerprint}`);
  pdfDoc.setCreator(orgName);

  return new Uint8Array(await pdfDoc.save());
}

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

function purchaseShortId(email: string, date: Date): string {
  let hash = 0;
  const str = email + date.toISOString().slice(0, 10);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
}

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
