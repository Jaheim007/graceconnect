/**
 * Certificate PDF renderer — Step B of the certificate feature.
 *
 * Renders the template designed in the course Settings tab
 * (programs.certificate_design): cover strip (1000x200), certification badge
 * (180x180, defaults to the platform avatar), the learner + course statement,
 * an optional lesson outline, the signature image (70x70) with its label, and
 * the footer text (defaults to the organization name).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { shouldWatermark, applyWatermark } from "../_shared/pdf-watermark.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Certificate images (cover, badge, signature) are stored on Supabase storage
 * but the app rewrites their URLs to the branded host api.siteviral.com. That
 * host is not always resolvable/proxied from inside the edge runtime, which
 * silently dropped the signature image. So we try the URL as-is and then fall
 * back to the raw project storage host.
 */
function imageUrlCandidates(url: string): string[] {
  const raw = Deno.env.get("SUPABASE_URL") || "";
  const out = [url];
  if (url.includes("api.siteviral.com") && raw) {
    out.push(url.split("https://api.siteviral.com").join(raw));
  }
  return out;
}

async function embedImage(pdfDoc: PDFDocument, url?: string | null) {
  if (!url) return null;
  for (const candidate of imageUrlCandidates(url)) {
    try {
      const res = await fetch(candidate, { redirect: "follow" });
      if (!res.ok) {
        console.warn(`[certificate-pdf] image fetch ${res.status}: ${candidate}`);
        continue;
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      const type = (res.headers.get("content-type") || "").toLowerCase();
      if (type.includes("png") || candidate.toLowerCase().includes(".png")) {
        try { return await pdfDoc.embedPng(bytes); } catch { /* fall through */ }
      }
      try {
        return await pdfDoc.embedJpg(bytes);
      } catch {
        try { return await pdfDoc.embedPng(bytes); } catch { /* try next */ }
      }
    } catch (e) {
      console.warn(`[certificate-pdf] image error: ${candidate}`, e);
    }
  }
  console.warn(`[certificate-pdf] could not embed image: ${url}`);
  return null;
}


function truncate(text: string, font: any, size: number, maxWidth: number) {
  let t = text;
  while (t.length > 3 && font.widthOfTextAtSize(t, size) > maxWidth) {
    t = t.slice(0, -2);
  }
  return t === text ? text : `${t}…`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const { certificateId } = await req.json();
    if (!certificateId) throw new Error("Missing certificateId");

    const { data: cert, error: certErr } = await sb
      .from("program_certificates")
      .select("*, programs:program_id(id, title, certificate_design, organizations:organization_id(name, logo_url, slug, owner_id))")
      .eq("id", certificateId)
      .eq("user_id", user.id)
      .single();

    if (certErr || !cert) throw new Error("Certificate not found");

    const program = (cert as any).programs || {};
    const org = program.organizations || {};
    const design = (program.certificate_design || {}) as Record<string, any>;

    const orgName = org.name || "Organization";
    const courseTitle = program.title || cert.course_title || "Course";
    const learnerName = cert.learner_name || user.email || "Learner";
    const certNumber = cert.certificate_number || cert.id.slice(0, 8).toUpperCase();
    const completedDate = new Date(cert.issued_at || cert.created_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
    const score = cert.assessment_score;
    const total = cert.assessment_total;

    const footerText = (design.footer_text ?? orgName) || orgName;
    const signatureLabel = design.signature_label || "Signed by";
    // Lesson outline is always printed on the certificate
    let lessonTitles: string[] = [];
    if (program.id) {
      const { data: modules } = await sb
        .from("program_modules")
        .select("id, order_index")
        .eq("program_id", program.id)
        .order("order_index");
      const moduleIds = (modules || []).map((m: any) => m.id);
      if (moduleIds.length) {
        const { data: lessons } = await sb
          .from("program_lessons")
          .select("title, order_index, module_id")
          .in("module_id", moduleIds)
          .order("order_index");
        lessonTitles = (lessons || []).map((l: any) => l.title).filter(Boolean);
      }
    }

    // Create PDF — standard certificate portrait 1414 x 2000
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([1414, 2000]);
    const { width, height } = page.getSize();
    const k = width / 595; // scale factor vs A4-portrait-points baseline

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const gold = rgb(0.76, 0.56, 0.11);
    const goldSoft = rgb(0.87, 0.75, 0.42);
    const ink = rgb(0.06, 0.07, 0.14);
    const dark = rgb(0.12, 0.13, 0.2);
    const muted = rgb(0.45, 0.46, 0.52);

    const center = (text: string, font: any, size: number) => (width - font.widthOfTextAtSize(text, size)) / 2;

    // Letter-spaced drawing for display type
    const drawTracked = (
      text: string, font: any, size: number, y: number, color: any, tracking: number,
    ) => {
      const chars = [...text];
      const total = chars.reduce((w, c) => w + font.widthOfTextAtSize(c, size), 0) + tracking * (chars.length - 1);
      let x = (width - total) / 2;
      for (const c of chars) {
        page.drawText(c, { x, y, size, font, color });
        x += font.widthOfTextAtSize(c, size) + tracking;
      }
    };

    // ---------- Background ----------
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.995, 0.99, 0.975) });
    // subtle warm vignette bands
    for (let i = 0; i < 10; i++) {
      page.drawRectangle({
        x: 0, y: (height / 10) * i, width, height: height / 10,
        color: rgb(0.98, 0.95, 0.88), opacity: 0.05 + i * 0.012,
      });
    }

    // Guilloche-style concentric rings behind the centre
    const ringCx = width / 2;
    const ringCy = height * 0.52;
    for (let i = 0; i < 14; i++) {
      page.drawCircle({
        x: ringCx, y: ringCy, size: 120 * k + i * 16 * k,
        borderColor: goldSoft, borderWidth: 0.5 * k, opacity: 0, borderOpacity: 0.10 - i * 0.005,
      });
    }

    // ---------- Frame ----------
    page.drawRectangle({ x: 22 * k, y: 22 * k, width: width - 44 * k, height: height - 44 * k, borderColor: gold, borderWidth: 3.2 * k });
    page.drawRectangle({ x: 33 * k, y: 33 * k, width: width - 66 * k, height: height - 66 * k, borderColor: goldSoft, borderWidth: 1 * k });
    page.drawRectangle({ x: 38 * k, y: 38 * k, width: width - 76 * k, height: height - 76 * k, borderColor: goldSoft, borderWidth: 0.5 * k, opacity: 0 });

    // Corner ornaments: nested gold brackets
    const cornerBrackets = (cx: number, cy: number, sx: number, sy: number) => {
      for (const [len, off, w] of [[62, 0, 2.4], [40, 9, 1.2], [22, 18, 0.8]] as const) {
        page.drawLine({
          start: { x: cx + sx * off * k, y: cy + sy * off * k },
          end: { x: cx + sx * (off + len) * k, y: cy + sy * off * k },
          color: gold, thickness: w * k,
        });
        page.drawLine({
          start: { x: cx + sx * off * k, y: cy + sy * off * k },
          end: { x: cx + sx * off * k, y: cy + sy * (off + len) * k },
          color: gold, thickness: w * k,
        });
      }
      page.drawCircle({ x: cx + sx * 34 * k, y: cy + sy * 34 * k, size: 4 * k, color: gold, opacity: 0.55 });
    };
    cornerBrackets(46 * k, 46 * k, 1, 1);
    cornerBrackets(width - 46 * k, 46 * k, -1, 1);
    cornerBrackets(46 * k, height - 46 * k, 1, -1);
    cornerBrackets(width - 46 * k, height - 46 * k, -1, -1);

    // ---------- Cover strip (1000x200 → 5:1) ----------
    const coverImg = await embedImage(pdfDoc, design.cover_image_url);
    const stripX = 46 * k;
    const stripW = width - 92 * k;
    const stripH = Math.round(stripW / 5);
    const stripY = height - 62 * k - stripH;
    if (coverImg) {
      page.drawImage(coverImg, { x: stripX, y: stripY, width: stripW, height: stripH });
      // dark scrim so the strip reads as a deliberate header band
      page.drawRectangle({ x: stripX, y: stripY, width: stripW, height: stripH, color: ink, opacity: 0.22 });
    } else {
      page.drawRectangle({ x: stripX, y: stripY, width: stripW, height: stripH, color: ink });
      for (let i = 0; i < 18; i++) {
        page.drawLine({
          start: { x: stripX + (stripW / 18) * i, y: stripY },
          end: { x: stripX + (stripW / 18) * i + stripH, y: stripY + stripH },
          color: goldSoft, thickness: 1 * k, opacity: 0.12,
        });
      }
      const oName = orgName.toUpperCase();
      drawTracked(oName, fontBold, 15 * k, stripY + stripH / 2 - 5 * k, rgb(0.95, 0.9, 0.75), 4 * k);
    }
    page.drawRectangle({ x: stripX, y: stripY, width: stripW, height: stripH, borderColor: gold, borderWidth: 1.4 * k, opacity: 0 });
    // gold rule under the header
    page.drawLine({ start: { x: stripX, y: stripY - 6 * k }, end: { x: stripX + stripW, y: stripY - 6 * k }, color: gold, thickness: 1.2 * k });

    // ---------- Badge medallion (180x180) ----------
    const badgeImg = await embedImage(pdfDoc, design.badge_image_url || org.logo_url);
    const badgeSize = 92 * k;
    const badgeY = stripY - badgeSize / 2 - 10 * k;
    const badgeCx = width / 2;
    const badgeCy = badgeY + badgeSize / 2;
    // medallion rings
    page.drawCircle({ x: badgeCx, y: badgeCy, size: badgeSize / 2 + 18 * k, color: rgb(1, 0.99, 0.96) });
    page.drawCircle({ x: badgeCx, y: badgeCy, size: badgeSize / 2 + 16 * k, borderColor: gold, borderWidth: 2.4 * k, opacity: 0 });
    page.drawCircle({ x: badgeCx, y: badgeCy, size: badgeSize / 2 + 10 * k, borderColor: goldSoft, borderWidth: 1 * k, opacity: 0 });
    // radiating ticks around the medallion
    const R1 = badgeSize / 2 + 22 * k;
    const R2 = badgeSize / 2 + 30 * k;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      page.drawLine({
        start: { x: badgeCx + Math.cos(a) * R1, y: badgeCy + Math.sin(a) * R1 },
        end: { x: badgeCx + Math.cos(a) * R2, y: badgeCy + Math.sin(a) * R2 },
        color: gold, thickness: 1.1 * k, opacity: i % 3 === 0 ? 0.65 : 0.28,
      });
    }
    if (badgeImg) {
      page.drawImage(badgeImg, { x: badgeCx - badgeSize / 2, y: badgeY, width: badgeSize, height: badgeSize });
    } else {
      page.drawCircle({ x: badgeCx, y: badgeCy, size: badgeSize / 2, color: rgb(0.97, 0.94, 0.86) });
      const initial = (orgName || "S").slice(0, 1).toUpperCase();
      page.drawText(initial, {
        x: badgeCx - fontBold.widthOfTextAtSize(initial, 40 * k) / 2,
        y: badgeCy - 14 * k, size: 40 * k, font: fontBold, color: gold,
      });
    }
    // ribbon tails under the medallion
    const ribbonTop = badgeCy - (badgeSize / 2 + 14 * k);
    for (const dir of [-1, 1]) {
      page.drawSvgPath(
        `M 0 0 L ${dir * 26 * k} 0 L ${dir * 34 * k} ${44 * k} L ${dir * 17 * k} ${32 * k} L ${dir * 6 * k} ${46 * k} Z`,
        { x: badgeCx + dir * 4 * k, y: ribbonTop, color: gold, opacity: 0.9 },
      );
    }

    let y = badgeY - 62 * k;

    // ---------- Title ----------
    drawTracked("CERTIFICATE", fontBold, 30 * k, y, ink, 9 * k);
    y -= 26 * k;
    drawTracked("OF COMPLETION", fontBold, 15 * k, y, gold, 8 * k);
    y -= 20 * k;
    // ornamental divider: line — diamond — line
    page.drawLine({ start: { x: width / 2 - 120 * k, y: y + 4 * k }, end: { x: width / 2 - 16 * k, y: y + 4 * k }, color: gold, thickness: 1.1 * k });
    page.drawLine({ start: { x: width / 2 + 16 * k, y: y + 4 * k }, end: { x: width / 2 + 120 * k, y: y + 4 * k }, color: gold, thickness: 1.1 * k });
    page.drawSvgPath(`M 0 0 L ${7 * k} ${7 * k} L 0 ${14 * k} L ${-7 * k} ${7 * k} Z`, { x: width / 2, y: y + 11 * k, color: gold });

    // ---------- Statement ----------
    y -= 38 * k;
    const ack = "This certificate acknowledges that";
    page.drawText(ack, { x: center(ack, fontItalic, 12.5 * k), y, size: 12.5 * k, font: fontItalic, color: muted });

    y -= 52 * k;
    const nameSize = (learnerName.length > 28 ? 28 : 36) * k;
    page.drawText(learnerName, { x: center(learnerName, fontBold, nameSize), y, size: nameSize, font: fontBold, color: dark });
    // gold underline swash beneath the name
    const nameW = fontBold.widthOfTextAtSize(learnerName, nameSize);
    const underlineW = Math.min(width - 160 * k, nameW + 60 * k);
    page.drawLine({
      start: { x: (width - underlineW) / 2, y: y - 14 * k },
      end: { x: (width + underlineW) / 2, y: y - 14 * k },
      color: gold, thickness: 1.6 * k, opacity: 0.7,
    });

    y -= 44 * k;
    const line2 = "has successfully fulfilled the requirements of the course";
    page.drawText(line2, { x: center(line2, fontRegular, 12 * k), y, size: 12 * k, font: fontRegular, color: muted });

    y -= 36 * k;
    const ctSize = (courseTitle.length > 46 ? 17 : 21) * k;
    const ct = truncate(`“${courseTitle}”`, fontBold, ctSize, width - 160 * k);
    page.drawText(ct, { x: center(ct, fontBold, ctSize), y, size: ctSize, font: fontBold, color: ink });

    // meta chips (date + score)
    y -= 34 * k;
    const chips: string[] = [completedDate];
    if (score !== undefined && score !== null && total) {
      chips.push(`Score ${score}/${total} · ${Math.round((score / total) * 100)}%`);
    }
    const chipH = 22 * k;
    const chipPad = 14 * k;
    const chipGap = 10 * k;
    const chipWidths = chips.map((c) => fontBold.widthOfTextAtSize(c, 9.5 * k) + chipPad * 2);
    const chipsTotal = chipWidths.reduce((a, b) => a + b, 0) + chipGap * (chips.length - 1);
    let cx = (width - chipsTotal) / 2;
    chips.forEach((c, i) => {
      page.drawRectangle({
        x: cx, y: y - 6 * k, width: chipWidths[i], height: chipH,
        color: rgb(0.99, 0.96, 0.89), borderColor: goldSoft, borderWidth: 0.8 * k,
      });
      page.drawText(c, { x: cx + chipPad, y: y, size: 9.5 * k, font: fontBold, color: rgb(0.5, 0.4, 0.15) });
      cx += chipWidths[i] + chipGap;
    });

    // ---------- Lesson outline (always shown when the course has lessons) ----------
    if (lessonTitles.length) {
      y -= 56 * k;
      drawTracked("COURSE OUTLINE", fontBold, 9.5 * k, y, rgb(0.55, 0.5, 0.42), 4 * k);
      y -= 8 * k;
      page.drawLine({ start: { x: 120 * k, y }, end: { x: width - 120 * k, y }, color: goldSoft, thickness: 0.7 * k });
      y -= 26 * k;

      const shown = lessonTitles.slice(0, 20);
      const colW = (width - 200 * k) / 2;
      const rows = Math.ceil(shown.length / 2);
      const rowH = 19 * k;
      shown.forEach((t, i) => {
        const col = i < rows ? 0 : 1;
        const row = i < rows ? i : i - rows;
        const bx = 100 * k + col * (colW + 10 * k);
        const by = y - row * rowH;
        page.drawSvgPath(`M 0 0 L ${4.5 * k} ${4.5 * k} L 0 ${9 * k} L ${-4.5 * k} ${4.5 * k} Z`, {
          x: bx + 5 * k, y: by + 9 * k, color: gold, opacity: 0.8,
        });
        const text = truncate(t, fontRegular, 10.5 * k, colW - 24 * k);
        page.drawText(text, { x: bx + 16 * k, y: by, size: 10.5 * k, font: fontRegular, color: rgb(0.36, 0.37, 0.42) });
      });
      y -= rows * rowH;
      if (lessonTitles.length > shown.length) {
        const more = `+ ${lessonTitles.length - shown.length} more lessons`;
        page.drawText(more, { x: center(more, fontItalic, 9.5 * k), y: y - 6 * k, size: 9.5 * k, font: fontItalic, color: rgb(0.6, 0.6, 0.6) });
      }
    }

    // ---------- Signature block ----------
    const sigImg = await embedImage(pdfDoc, design.signature_image_url);
    const sigBaseY = 172 * k;
    if (sigImg) {
      const s = 54 * k;
      page.drawImage(sigImg, { x: (width - s) / 2, y: sigBaseY + 20 * k, width: s, height: s });
    }
    page.drawLine({
      start: { x: width / 2 - 90 * k, y: sigBaseY + 16 * k },
      end: { x: width / 2 + 90 * k, y: sigBaseY + 16 * k },
      color: rgb(0.75, 0.75, 0.78), thickness: 0.8 * k,
    });
    drawTracked(signatureLabel.toUpperCase(), fontBold, 8.5 * k, sigBaseY, rgb(0.45, 0.45, 0.5), 3 * k);
    page.drawText(footerText, {
      x: center(footerText, fontBold, 11.5 * k), y: sigBaseY - 22 * k, size: 11.5 * k, font: fontBold, color: dark,
    });

    // ---------- Footer: verification ----------
    page.drawLine({ start: { x: 110 * k, y: 108 * k }, end: { x: width - 110 * k, y: 108 * k }, color: goldSoft, thickness: 0.8 * k });

    const certLabel = `CERTIFICATE No. ${certNumber}`;
    const pillW = fontBold.widthOfTextAtSize(certLabel, 10 * k) + 40 * k;
    page.drawRectangle({
      x: (width - pillW) / 2, y: 72 * k, width: pillW, height: 26 * k,
      color: ink,
    });
    page.drawText(certLabel, {
      x: center(certLabel, fontBold, 10 * k), y: 80 * k, size: 10 * k, font: fontBold, color: rgb(0.96, 0.9, 0.72),
    });

    const verifyLine = `Verify this certificate at siteviral.com/verify/${certNumber}`;
    page.drawText(verifyLine, {
      x: center(verifyLine, fontRegular, 9.5 * k), y: 54 * k, size: 9.5 * k, font: fontRegular, color: rgb(0.5, 0.5, 0.55),
    });
    const poweredBy = "Powered by SiteViral";
    page.drawText(poweredBy, {
      x: center(poweredBy, fontItalic, 8.5 * k), y: 40 * k, size: 8.5 * k, font: fontItalic, color: rgb(0.68, 0.68, 0.72),
    });

    const ownerId = org.owner_id || null;
    if (await shouldWatermark(sb, ownerId)) {
      await applyWatermark(pdfDoc, "en");
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certNumber}.pdf"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
