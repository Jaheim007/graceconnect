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

async function embedImage(pdfDoc: PDFDocument, url?: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const type = (res.headers.get("content-type") || "").toLowerCase();
    if (type.includes("png") || url.toLowerCase().includes(".png")) {
      return await pdfDoc.embedPng(bytes);
    }
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return await pdfDoc.embedPng(bytes);
    }
  } catch {
    return null;
  }
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
    const showLessons = design.show_lessons !== false;

    // Lesson outline (only when enabled)
    let lessonTitles: string[] = [];
    if (showLessons && program.id) {
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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const gold = rgb(0.72, 0.53, 0.04);
    const dark = rgb(0.15, 0.15, 0.15);
    const muted = rgb(0.45, 0.45, 0.45);

    const center = (text: string, font: any, size: number) => (width - font.widthOfTextAtSize(text, size)) / 2;

    // Background + border
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.99, 0.985, 0.97) });
    page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: gold, borderWidth: 2.5 });
    page.drawRectangle({ x: 27, y: 27, width: width - 54, height: height - 54, borderColor: rgb(0.85, 0.74, 0.35), borderWidth: 0.75 });

    // Cover strip (1000x200 → 5:1)
    const coverImg = await embedImage(pdfDoc, design.cover_image_url);
    const stripX = 32;
    const stripW = width - 64;
    const stripH = Math.round(stripW / 5);
    const stripY = height - 32 - stripH;
    if (coverImg) {
      page.drawImage(coverImg, { x: stripX, y: stripY, width: stripW, height: stripH });
    } else {
      page.drawRectangle({ x: stripX, y: stripY, width: stripW, height: stripH, color: rgb(0.96, 0.93, 0.85) });
      const oName = orgName.toUpperCase();
      page.drawText(oName, {
        x: center(oName, fontBold, 12),
        y: stripY + stripH / 2 - 4,
        size: 12, font: fontBold, color: rgb(0.55, 0.45, 0.2),
      });
    }

    // Badge (180x180) overlapping the strip
    const badgeImg = await embedImage(pdfDoc, design.badge_image_url || org.logo_url);
    const badgeSize = 62;
    const badgeY = stripY - badgeSize / 2;
    if (badgeImg) {
      page.drawImage(badgeImg, { x: (width - badgeSize) / 2, y: badgeY, width: badgeSize, height: badgeSize });
    } else {
      page.drawRectangle({
        x: (width - badgeSize) / 2, y: badgeY, width: badgeSize, height: badgeSize,
        color: rgb(0.96, 0.93, 0.85), borderColor: gold, borderWidth: 1,
      });
    }

    let y = badgeY - 26;

    // Title
    const title = "CERTIFICATE OF COMPLETION";
    page.drawText(title, { x: center(title, fontBold, 22), y, size: 22, font: fontBold, color: dark });
    y -= 12;
    page.drawLine({ start: { x: width / 2 - 70, y }, end: { x: width / 2 + 70, y }, color: gold, thickness: 1.2 });

    // Statement
    y -= 24;
    const ack = "This certificate acknowledges that";
    page.drawText(ack, { x: center(ack, fontItalic, 11), y, size: 11, font: fontItalic, color: muted });

    y -= 30;
    const nameSize = learnerName.length > 28 ? 24 : 30;
    page.drawText(learnerName, { x: center(learnerName, fontBold, nameSize), y, size: nameSize, font: fontBold, color: gold });

    y -= 24;
    const line2 = "has successfully fulfilled the requirements of the course";
    page.drawText(line2, { x: center(line2, fontRegular, 11), y, size: 11, font: fontRegular, color: muted });

    y -= 24;
    const ctSize = courseTitle.length > 46 ? 15 : 19;
    const ct = truncate(`“${courseTitle}”`, fontBold, ctSize, width - 160);
    page.drawText(ct, { x: center(ct, fontBold, ctSize), y, size: ctSize, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

    y -= 20;
    let meta = `Completed on ${completedDate}`;
    if (score !== undefined && score !== null && total) {
      meta += ` • Score ${score}/${total} (${Math.round((score / total) * 100)}%)`;
    }
    page.drawText(meta, { x: center(meta, fontRegular, 10), y, size: 10, font: fontRegular, color: rgb(0.55, 0.55, 0.55) });

    // Lesson outline
    if (showLessons && lessonTitles.length) {
      y -= 26;
      const label = "COURSE OUTLINE";
      page.drawText(label, { x: center(label, fontBold, 8), y, size: 8, font: fontBold, color: rgb(0.6, 0.6, 0.6) });
      y -= 14;

      const shown = lessonTitles.slice(0, 8);
      const colW = (width - 220) / 2;
      const rows = Math.ceil(shown.length / 2);
      shown.forEach((t, i) => {
        const col = i < rows ? 0 : 1;
        const row = i < rows ? i : i - rows;
        const text = truncate(`• ${t}`, fontRegular, 9, colW);
        page.drawText(text, {
          x: 110 + col * (colW + 10),
          y: y - row * 12,
          size: 9, font: fontRegular, color: rgb(0.45, 0.45, 0.45),
        });
      });
      y -= rows * 12;
      if (lessonTitles.length > shown.length) {
        const more = `+ ${lessonTitles.length - shown.length} more lessons`;
        page.drawText(more, { x: center(more, fontItalic, 8), y: y - 4, size: 8, font: fontItalic, color: rgb(0.6, 0.6, 0.6) });
      }
    }

    // Signature block
    const sigImg = await embedImage(pdfDoc, design.signature_image_url);
    const sigBaseY = 92;
    if (sigImg) {
      const s = 34;
      page.drawImage(sigImg, { x: (width - s) / 2, y: sigBaseY + 12, width: s, height: s });
    }
    page.drawText(signatureLabel, {
      x: center(signatureLabel, fontBold, 9), y: sigBaseY, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(footerText, {
      x: center(footerText, fontRegular, 9), y: sigBaseY - 13, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    page.drawLine({ start: { x: 100, y: 62 }, end: { x: width - 100, y: 62 }, color: gold, thickness: 0.5 });
    const certNumText = `Certificate No: ${certNumber}`;
    page.drawText(certNumText, {
      x: center(certNumText, fontRegular, 9), y: 46, size: 9, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
    });
    const poweredBy = "Powered by SiteViral";
    page.drawText(poweredBy, {
      x: center(poweredBy, fontItalic, 8), y: 33, size: 8, font: fontItalic, color: rgb(0.7, 0.7, 0.7),
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
