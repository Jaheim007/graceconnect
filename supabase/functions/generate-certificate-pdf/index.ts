import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const { certificateId } = await req.json();
    if (!certificateId) throw new Error("Missing certificateId");

    // Fetch certificate data
    const { data: cert, error: certErr } = await sb
      .from("program_certificates")
      .select("*, programs:program_id(title, organizations:organization_id(name, logo_url, slug))")
      .eq("id", certificateId)
      .eq("user_id", user.id)
      .single();

    if (certErr || !cert) throw new Error("Certificate not found");

    const orgName = (cert as any).programs?.organizations?.name || "Organization";
    const courseTitle = (cert as any).programs?.title || cert.course_title || "Course";
    const learnerName = cert.learner_name || user.email || "Learner";
    const certNumber = cert.certificate_number || cert.id.slice(0, 8).toUpperCase();
    const completedDate = new Date(cert.issued_at || cert.created_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
    const stars = cert.stars_earned || 0;
    const score = cert.assessment_score;
    const total = cert.assessment_total;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.98, 0.97, 0.95) });

    // Border
    const bw = 3;
    page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: rgb(0.72, 0.53, 0.04), borderWidth: bw });
    page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: rgb(0.82, 0.68, 0.21), borderWidth: 1 });

    // Decorative corner elements (simple lines)
    const cornerSize = 40;
    const corners = [
      { x: 35, y: height - 35 }, // top-left
      { x: width - 35, y: height - 35 }, // top-right
      { x: 35, y: 35 }, // bottom-left
      { x: width - 35, y: 35 }, // bottom-right
    ];
    const gold = rgb(0.72, 0.53, 0.04);

    // Top decorative line
    page.drawLine({ start: { x: 100, y: height - 70 }, end: { x: width - 100, y: height - 70 }, color: gold, thickness: 0.5 });

    // Organization name
    const orgNameWidth = fontBold.widthOfTextAtSize(orgName.toUpperCase(), 11);
    page.drawText(orgName.toUpperCase(), {
      x: (width - orgNameWidth) / 2,
      y: height - 95,
      size: 11,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Title
    const title = "CERTIFICATE OF COMPLETION";
    const titleWidth = fontBold.widthOfTextAtSize(title, 28);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height - 150,
      size: 28,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });

    // Decorative line under title
    page.drawLine({ start: { x: width / 2 - 80, y: height - 165 }, end: { x: width / 2 + 80, y: height - 165 }, color: gold, thickness: 1.5 });

    // "This certifies that"
    const subtitle = "This certifies that";
    const subtitleWidth = fontItalic.widthOfTextAtSize(subtitle, 13);
    page.drawText(subtitle, {
      x: (width - subtitleWidth) / 2,
      y: height - 200,
      size: 13,
      font: fontItalic,
      color: rgb(0.45, 0.45, 0.45),
    });

    // Learner name
    const nameSize = learnerName.length > 25 ? 30 : 36;
    const nameWidth = fontBold.widthOfTextAtSize(learnerName, nameSize);
    page.drawText(learnerName, {
      x: (width - nameWidth) / 2,
      y: height - 245,
      size: nameSize,
      font: fontBold,
      color: rgb(0.72, 0.53, 0.04),
    });

    // "has successfully completed"
    const completed = "has successfully completed the course";
    const completedWidth = fontRegular.widthOfTextAtSize(completed, 13);
    page.drawText(completed, {
      x: (width - completedWidth) / 2,
      y: height - 280,
      size: 13,
      font: fontRegular,
      color: rgb(0.45, 0.45, 0.45),
    });

    // Course title
    const ctSize = courseTitle.length > 40 ? 18 : 22;
    const ctWidth = fontBold.widthOfTextAtSize(`"${courseTitle}"`, ctSize);
    page.drawText(`"${courseTitle}"`, {
      x: (width - ctWidth) / 2,
      y: height - 315,
      size: ctSize,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Score / Stars
    let scoreText = "";
    if (score !== undefined && score !== null && total) {
      scoreText = `Score: ${score}/${total} (${Math.round((score / total) * 100)}%)`;
    }
    if (stars > 0) {
      scoreText += scoreText ? ` • ${stars} ★` : `${stars} ★ earned`;
    }
    if (scoreText) {
      const scoreWidth = fontRegular.widthOfTextAtSize(scoreText, 12);
      page.drawText(scoreText, {
        x: (width - scoreWidth) / 2,
        y: height - 350,
        size: 12,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Date
    const dateText = `Completed on ${completedDate}`;
    const dateWidth = fontRegular.widthOfTextAtSize(dateText, 11);
    page.drawText(dateText, {
      x: (width - dateWidth) / 2,
      y: height - 385,
      size: 11,
      font: fontRegular,
      color: rgb(0.55, 0.55, 0.55),
    });

    // Bottom line
    page.drawLine({ start: { x: 100, y: 80 }, end: { x: width - 100, y: 80 }, color: gold, thickness: 0.5 });

    // Certificate number
    const certNumText = `Certificate No: ${certNumber}`;
    const certNumWidth = fontRegular.widthOfTextAtSize(certNumText, 9);
    page.drawText(certNumText, {
      x: (width - certNumWidth) / 2,
      y: 60,
      size: 9,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Powered by
    const poweredBy = "Powered by SeedViral";
    const poweredWidth = fontItalic.widthOfTextAtSize(poweredBy, 8);
    page.drawText(poweredBy, {
      x: (width - poweredWidth) / 2,
      y: 45,
      size: 8,
      font: fontItalic,
      color: rgb(0.7, 0.7, 0.7),
    });

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
