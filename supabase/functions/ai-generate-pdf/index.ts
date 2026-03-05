import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb, degrees } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612, height: 792 },
} as const;

type ChapterInput = {
  title?: string;
  content?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const body = await req.json().catch(() => ({})) as {
      org_id?: string;
      project_id?: string;
      format?: string;
      page_size?: string;
    };

    const { org_id, project_id, format, page_size } = body;
    if (!org_id || !project_id) return jsonError('org_id and project_id required', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonError('Forbidden', 403);
    }

    const { data: project, error: projErr } = await admin
      .from('ai_content_projects')
      .select('*')
      .eq('id', project_id)
      .eq('organization_id', org_id)
      .single();

    if (projErr || !project) return jsonError('Project not found', 404);

    const [{ data: coverAsset }, { data: org }] = await Promise.all([
      admin
        .from('ai_project_assets')
        .select('file_url')
        .eq('project_id', project_id)
        .eq('is_cover', true)
        .maybeSingle(),
      admin
        .from('organizations')
        .select('name')
        .eq('id', org_id)
        .maybeSingle(),
    ]);

    const projectData = (project.structure_json || project.data_json || {}) as { chapters?: ChapterInput[] };
    const chapters = Array.isArray(projectData.chapters) ? projectData.chapters : [];

    const normalizedPageSize = String(page_size || 'A4').toUpperCase() === 'LETTER' ? 'LETTER' : 'A4';
    const projectFormat = String(format || 'ebook');

    const pdfBytes = await buildProfessionalPdf({
      title: asText(project.title, 'Document'),
      subtitle: asText(project.objective, ''),
      orgName: asText(org?.name, 'Siteviral'),
      language: asText(project.language, 'fr'),
      chapters,
      coverUrl: asText(coverAsset?.file_url, ''),
      pageSize: normalizedPageSize,
      format: projectFormat,
    });

    const storagePath = `${org_id}/${project_id}/exports/document-${Date.now()}.pdf`;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    const { error: uploadErr } = await admin.storage
      .from('org-uploads')
      .upload(storagePath, blob, { contentType: 'application/pdf', upsert: true });

    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      return jsonError('Failed to store document', 500);
    }

    const { data: asset, error: assetErr } = await admin
      .from('ai_assets')
      .upsert({
        org_id,
        project_id,
        asset_type: 'pdf',
        storage_bucket: 'org-uploads',
        storage_path: storagePath,
        mime_type: 'application/pdf',
        metadata: {
          format: projectFormat,
          page_size: normalizedPageSize,
          chapters_count: chapters.length,
          generated_at: new Date().toISOString(),
          pdf_engine: 'pdf-lib',
        },
      }, { onConflict: 'storage_bucket,storage_path' })
      .select('id')
      .single();

    if (assetErr) console.error('Asset record error:', assetErr);

    await admin.from('ai_project_assets').insert({
      project_id,
      organization_id: org_id,
      asset_type: 'pdf',
      file_url: `${supabaseUrl}/storage/v1/object/public/org-uploads/${storagePath}`,
      mime_type: 'application/pdf',
      label: `Export ${projectFormat} (${normalizedPageSize})`,
      metadata: { format: projectFormat, page_size: normalizedPageSize },
    }).select().maybeSingle();

    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'studio.pdf_generated',
      resource_type: 'ai_content_project',
      resource_id: project_id,
      organization_id: org_id,
      metadata: { format: projectFormat, page_size: normalizedPageSize, asset_id: asset?.id },
    });

    return new Response(JSON.stringify({
      ok: true,
      asset_id: asset?.id,
      download_url: `${supabaseUrl}/storage/v1/object/public/org-uploads/${storagePath}`,
      format: projectFormat,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-generate-pdf error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToParagraphs(html: string): string[] {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|section|article)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ');

  return decodeEntities(withBreaks)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const sanitized = text.replace(/\s+/g, ' ').trim();
  if (!sanitized) return [];

  const words = sanitized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);

    if (width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

async function tryDrawCover(pdfDoc: PDFDocument, page: any, coverUrl: string) {
  if (!coverUrl) return false;

  try {
    const response = await fetch(coverUrl);
    if (!response.ok) return false;

    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const lower = coverUrl.toLowerCase();

    let image: any = null;
    if (contentType.includes('png') || lower.endsWith('.png')) {
      image = await pdfDoc.embedPng(bytes);
    } else if (contentType.includes('jpeg') || contentType.includes('jpg') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(bytes);
    }

    if (!image) return false;

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const imageDims = image.scale(1);
    const scale = Math.max(pageWidth / imageDims.width, pageHeight / imageDims.height);

    const width = imageDims.width * scale;
    const height = imageDims.height * scale;
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    page.drawImage(image, { x, y, width, height });
    return true;
  } catch {
    return false;
  }
}

function addWatermarkAndFooter(pdfDoc: PDFDocument, orgName: string, language: string) {
  const pages = pdfDoc.getPages();
  const generatedOn = new Date().toLocaleDateString(language.startsWith('fr') ? 'fr-FR' : 'en-US');
  const total = pages.length;

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();

    page.drawText(orgName.toUpperCase(), {
      x: width * 0.14,
      y: height * 0.42,
      size: 40,
      font: page.doc.embedStandardFont ? undefined : undefined,
      color: rgb(0.88, 0.91, 0.96),
      rotate: degrees(35),
      opacity: 0.28,
    });

    page.drawLine({
      start: { x: 42, y: 30 },
      end: { x: width - 42, y: 30 },
      thickness: 0.5,
      color: rgb(0.86, 0.89, 0.94),
    });

    const footerFont = pdfDoc.embedStandardFont ? undefined : undefined;
    page.drawText(`${orgName} • ${generatedOn}`, {
      x: 44,
      y: 18,
      size: 9,
      font: footerFont,
      color: rgb(0.45, 0.5, 0.58),
    });

    page.drawText(`Page ${index + 1}/${total}`, {
      x: width - 88,
      y: 18,
      size: 9,
      font: footerFont,
      color: rgb(0.45, 0.5, 0.58),
    });
  });
}

async function buildProfessionalPdf(opts: {
  title: string;
  subtitle: string;
  orgName: string;
  language: string;
  chapters: ChapterInput[];
  coverUrl: string;
  pageSize: 'A4' | 'LETTER';
  format: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const serif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesBold);
  const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = PAGE_SIZES[opts.pageSize] || PAGE_SIZES.A4;
  const margin = 52;
  const contentWidth = page.width - (margin * 2);
  const bodyFontSize = opts.format === 'kids' ? 13 : 11;
  const lineHeight = bodyFontSize * 1.5;

  const coverPage = pdfDoc.addPage([page.width, page.height]);
  const hasCover = await tryDrawCover(pdfDoc, coverPage, opts.coverUrl);

  if (!hasCover) {
    coverPage.drawRectangle({ x: 0, y: 0, width: page.width, height: page.height, color: rgb(0.95, 0.97, 1) });
  }

  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: page.width,
    height: page.height,
    color: rgb(0.03, 0.09, 0.18),
    opacity: hasCover ? 0.38 : 0.12,
  });

  const titleLines = wrapText(opts.title, page.width - 120, serifBold, 28).slice(0, 3);
  let titleY = page.height - 220;
  titleLines.forEach((line) => {
    const width = serifBold.widthOfTextAtSize(line, 28);
    coverPage.drawText(line, {
      x: (page.width - width) / 2,
      y: titleY,
      size: 28,
      font: serifBold,
      color: rgb(1, 1, 1),
    });
    titleY -= 36;
  });

  if (opts.subtitle) {
    const subtitle = wrapText(opts.subtitle, page.width - 140, sans, 12).slice(0, 2).join(' ');
    if (subtitle) {
      const subtitleWidth = sans.widthOfTextAtSize(subtitle, 12);
      coverPage.drawText(subtitle, {
        x: (page.width - subtitleWidth) / 2,
        y: titleY - 6,
        size: 12,
        font: sans,
        color: rgb(0.94, 0.97, 1),
      });
    }
  }

  const orgLabel = opts.orgName;
  const orgWidth = sans.widthOfTextAtSize(orgLabel, 13);
  coverPage.drawText(orgLabel, {
    x: (page.width - orgWidth) / 2,
    y: 96,
    size: 13,
    font: sans,
    color: rgb(0.93, 0.96, 1),
  });

  let tocPage = pdfDoc.addPage([page.width, page.height]);
  let tocY = page.height - margin;
  tocPage.drawText('Table des matières', {
    x: margin,
    y: tocY,
    size: 22,
    font: serifBold,
    color: rgb(0.08, 0.12, 0.22),
  });
  tocY -= 34;

  (opts.chapters.length ? opts.chapters : [{ title: 'Introduction', content: '' }]).forEach((chapter, index) => {
    if (tocY < 80) {
      tocPage = pdfDoc.addPage([page.width, page.height]);
      tocY = page.height - margin;
    }

    const chapterTitle = asText(chapter.title, `Chapitre ${index + 1}`);
    const line = `${index + 1}. ${chapterTitle}`;
    tocPage.drawText(line, {
      x: margin,
      y: tocY,
      size: 12,
      font: serif,
      color: rgb(0.15, 0.18, 0.28),
    });
    tocY -= 20;
  });

  const chapters = opts.chapters.length ? opts.chapters : [{ title: 'Contenu', content: 'Aucun contenu disponible.' }];

  for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex += 1) {
    const chapter = chapters[chapterIndex];
    let chapterPage = pdfDoc.addPage([page.width, page.height]);
    let y = page.height - margin;

    const chapterTitle = asText(chapter.title, `Chapitre ${chapterIndex + 1}`);
    chapterPage.drawText(`Chapitre ${chapterIndex + 1}`, {
      x: margin,
      y,
      size: 11,
      font: sans,
      color: rgb(0.22, 0.3, 0.5),
    });
    y -= 20;

    const titleLinesChapter = wrapText(chapterTitle, contentWidth, serifBold, 20);
    titleLinesChapter.forEach((line) => {
      chapterPage.drawText(line, {
        x: margin,
        y,
        size: 20,
        font: serifBold,
        color: rgb(0.09, 0.13, 0.22),
      });
      y -= 28;
    });

    y -= 8;

    const paragraphs = htmlToParagraphs(asText(chapter.content, ''));
    const safeParagraphs = paragraphs.length ? paragraphs : ['Contenu en cours de préparation.'];

    for (const paragraph of safeParagraphs) {
      const lines = wrapText(paragraph, contentWidth, serif, bodyFontSize);

      for (const line of lines) {
        if (y < margin + 30) {
          chapterPage = pdfDoc.addPage([page.width, page.height]);
          y = page.height - margin;
          chapterPage.drawText(`${chapterTitle} (suite)`, {
            x: margin,
            y,
            size: 11,
            font: sans,
            color: rgb(0.35, 0.42, 0.55),
          });
          y -= 22;
        }

        chapterPage.drawText(line, {
          x: margin,
          y,
          size: bodyFontSize,
          font: serif,
          color: rgb(0.15, 0.18, 0.26),
        });
        y -= lineHeight;
      }

      y -= 7;
    }
  }

  const pages = pdfDoc.getPages();
  const generatedOn = new Date().toLocaleDateString(opts.language.startsWith('fr') ? 'fr-FR' : 'en-US');
  const total = pages.length;

  pages.forEach((p, index) => {
    const { width, height } = p.getSize();

    p.drawText(opts.orgName.toUpperCase(), {
      x: width * 0.14,
      y: height * 0.42,
      size: 40,
      font: sans,
      color: rgb(0.88, 0.91, 0.96),
      rotate: degrees(35),
      opacity: 0.28,
    });

    p.drawLine({
      start: { x: 42, y: 30 },
      end: { x: width - 42, y: 30 },
      thickness: 0.5,
      color: rgb(0.86, 0.89, 0.94),
    });

    p.drawText(`${opts.orgName} • ${generatedOn}`, {
      x: 44,
      y: 18,
      size: 9,
      font: sans,
      color: rgb(0.45, 0.5, 0.58),
    });

    p.drawText(`Page ${index + 1}/${total}`, {
      x: width - 88,
      y: 18,
      size: 9,
      font: sans,
      color: rgb(0.45, 0.5, 0.58),
    });
  });

  return await pdfDoc.save();
}

