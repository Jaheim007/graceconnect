import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, degrees, PDFPage, PDFFont, PDFName, PDFArray, PDFDict, PDFNumber, PDFRef } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612, height: 792 },
} as const;

type ChapterInput = { title?: string; content?: string };

// ── Deno serve ──────────────────────────────────────────────────────
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
      org_id?: string; project_id?: string; format?: string; page_size?: string;
      preview_only?: boolean; chapters?: ChapterInput[]; title?: string; style?: string; cover_url?: string;
    };
    const { org_id, project_id, format, page_size, preview_only, title: directTitle, style: directStyle, cover_url: directCoverUrl } = body;

    const admin = createClient(supabaseUrl, serviceKey);
    const normalizedPageSize = String(page_size || 'A4').toUpperCase() === 'LETTER' ? 'LETTER' : 'A4';
    const projectFormat = String(format || directStyle || 'ebook');

    // ── PREVIEW MODE: accept raw chapters, no org/project needed ──
    if (preview_only && Array.isArray(body.chapters) && body.chapters.length > 0) {
      const pdfBytes = await buildProfessionalPdf({
        title: directTitle || 'Document',
        subtitle: '',
        orgName: 'Siteviral',
        language: 'fr',
        chapters: body.chapters,
        coverUrl: directCoverUrl || '',
        pageSize: normalizedPageSize,
        format: projectFormat,
      });

      // Store temporarily for preview
      const previewPath = `previews/${user.id}/${Date.now()}.pdf`;
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const { error: uploadErr } = await admin.storage
        .from('org-uploads').upload(previewPath, blob, { contentType: 'application/pdf', upsert: true });
      if (uploadErr) { console.error('Preview upload error:', uploadErr); return jsonError('Failed to store preview', 500); }

      return new Response(JSON.stringify({
        ok: true,
        download_url: `${supabaseUrl}/storage/v1/object/public/org-uploads/${previewPath}`,
        format: projectFormat,
        preview: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── FULL MODE: requires org_id and project_id ──
    if (!org_id || !project_id) return jsonError('org_id and project_id required', 400);

    const { data: member } = await admin
      .from('organization_members').select('role')
      .eq('user_id', user.id).eq('organization_id', org_id).maybeSingle();
    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) return jsonError('Forbidden', 403);

    const { data: project, error: projErr } = await admin
      .from('ai_content_projects').select('*')
      .eq('id', project_id).eq('organization_id', org_id).single();
    if (projErr || !project) return jsonError('Project not found', 404);

    const [{ data: coverAsset }, { data: org }] = await Promise.all([
      admin.from('ai_project_assets').select('file_url')
        .eq('project_id', project_id).eq('is_cover', true).maybeSingle(),
      admin.from('organizations').select('name').eq('id', org_id).maybeSingle(),
    ]);

    const projectData = (project.structure_json || project.data_json || {}) as { chapters?: ChapterInput[] };
    const chapters = Array.isArray(projectData.chapters) ? projectData.chapters : [];

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
      .from('org-uploads').upload(storagePath, blob, { contentType: 'application/pdf', upsert: true });
    if (uploadErr) { console.error('Upload error:', uploadErr); return jsonError('Failed to store document', 500); }

    const { data: asset, error: assetErr } = await admin
      .from('ai_assets').upsert({
        org_id, project_id, asset_type: 'pdf', storage_bucket: 'org-uploads',
        storage_path: storagePath, mime_type: 'application/pdf',
        metadata: { format: projectFormat, page_size: normalizedPageSize, chapters_count: chapters.length, generated_at: new Date().toISOString(), pdf_engine: 'pdf-lib' },
      }, { onConflict: 'storage_bucket,storage_path' }).select('id').single();
    if (assetErr) console.error('Asset record error:', assetErr);

    await admin.from('ai_project_assets').insert({
      project_id, organization_id: org_id, asset_type: 'pdf',
      file_url: `${supabaseUrl}/storage/v1/object/public/org-uploads/${storagePath}`,
      mime_type: 'application/pdf', label: `Export ${projectFormat} (${normalizedPageSize})`,
      metadata: { format: projectFormat, page_size: normalizedPageSize },
    }).select().maybeSingle();

    await admin.from('audit_logs').insert({
      user_id: user.id, action: 'studio.pdf_generated', resource_type: 'ai_content_project',
      resource_id: project_id, organization_id: org_id,
      metadata: { format: projectFormat, page_size: normalizedPageSize, asset_id: asset?.id },
    });

    return new Response(JSON.stringify({
      ok: true, asset_id: asset?.id,
      download_url: `${supabaseUrl}/storage/v1/object/public/org-uploads/${storagePath}`,
      format: projectFormat,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('ai-generate-pdf error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

// ── Helpers ─────────────────────────────────────────────────────────
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// ── HTML → structured blocks ────────────────────────────────────────
type Block = { type: 'paragraph' | 'heading' | 'quote' | 'bullet' | 'separator'; text: string };

function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  // Extract headings
  const processed = html
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, (_, content) => {
      blocks.push({ type: 'heading', text: stripTags(content) });
      return '';
    })
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_, content) => {
      blocks.push({ type: 'quote', text: stripTags(content) });
      return '';
    })
    .replace(/<li[^>]*>(.*?)<\/li>/gi, (_, content) => {
      blocks.push({ type: 'bullet', text: stripTags(content) });
      return '';
    })
    .replace(/<hr\s*\/?>/gi, () => {
      blocks.push({ type: 'separator', text: '' });
      return '';
    });

  // Remaining paragraphs
  const withBreaks = processed
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  decodeEntities(withBreaks)
    .split(/\n+/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .forEach(text => blocks.push({ type: 'paragraph', text }));

  // Sort blocks by their original appearance (rough heuristic: keep order of insertion)
  return blocks.length ? blocks : [{ type: 'paragraph', text: 'Contenu en cours de préparation.' }];
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function htmlToParagraphs(html: string): string[] {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|section|article)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(withBreaks).split(/\n+/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// ── Text wrapping ───────────────────────────────────────────────────
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const sanitized = text.replace(/\s+/g, ' ').trim();
  if (!sanitized) return [];
  const words = sanitized.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) { current = candidate; continue; }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

// ── Cover image ─────────────────────────────────────────────────────
async function tryDrawCover(pdfDoc: any, page: PDFPage, coverUrl: string) {
  if (!coverUrl) return false;
  try {
    const response = await fetch(coverUrl);
    if (!response.ok) return false;
    const bytes = new Uint8Array(await response.arrayBuffer());
    const ct = (response.headers.get('content-type') || '').toLowerCase();
    const lower = coverUrl.toLowerCase();
    let image: any = null;
    if (ct.includes('png') || lower.endsWith('.png')) image = await pdfDoc.embedPng(bytes);
    else if (ct.includes('jpeg') || ct.includes('jpg') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) image = await pdfDoc.embedJpg(bytes);
    if (!image) return false;
    const pw = page.getWidth(), ph = page.getHeight();
    const dims = image.scale(1);
    const scale = Math.max(pw / dims.width, ph / dims.height);
    const w = dims.width * scale, h = dims.height * scale;
    page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    return true;
  } catch { return false; }
}

// ── Professional PDF builder ────────────────────────────────────────
async function buildProfessionalPdf(opts: {
  title: string; subtitle: string; orgName: string; language: string;
  chapters: ChapterInput[]; coverUrl: string; pageSize: 'A4' | 'LETTER'; format: string;
}) {
  const pdfDoc = await PDFDocument.create();

  // Metadata
  pdfDoc.setTitle(opts.title);
  pdfDoc.setAuthor(opts.orgName);
  pdfDoc.setSubject(opts.subtitle || opts.title);
  pdfDoc.setCreator('Siteviral AI Studio');
  pdfDoc.setProducer('pdf-lib');
  pdfDoc.setCreationDate(new Date());

  const serif = await pdfDoc.embedFont('Times-Roman');
  const serifBold = await pdfDoc.embedFont('Times-Bold');
  const serifItalic = await pdfDoc.embedFont('Times-Italic');
  const sans = await pdfDoc.embedFont('Helvetica');
  const sansBold = await pdfDoc.embedFont('Helvetica-Bold');

  const pg = PAGE_SIZES[opts.pageSize] || PAGE_SIZES.A4;
  const isKids = opts.format === 'kids';
  const marginOuter = 60;
  const marginInner = 72; // larger inner margin for binding
  const marginTop = 70;
  const marginBottom = 56;
  const contentWidth = pg.width - marginOuter - marginInner;
  const bodyFontSize = isKids ? 13 : 11;
  const bodyLineHeight = bodyFontSize * 1.65;
  const paragraphSpacing = bodyFontSize * 0.8;

  const isFr = opts.language.startsWith('fr');
  const tocLabel = isFr ? 'Table des matières' : 'Table of Contents';
  const chapterWord = isFr ? 'Chapitre' : 'Chapter';
  const contLabel = isFr ? '(suite)' : '(continued)';

  const chapters = opts.chapters.length
    ? opts.chapters
    : [{ title: isFr ? 'Introduction' : 'Introduction', content: isFr ? 'Aucun contenu disponible.' : 'No content available.' }];

  // Track chapter page refs for clickable TOC
  const chapterPageRefs: PDFRef[] = [];

  // ── 1. COVER PAGE ──────────────────────────────────────────────
  const coverPage = pdfDoc.addPage([pg.width, pg.height]);
  const hasCover = await tryDrawCover(pdfDoc, coverPage, opts.coverUrl);

  if (!hasCover) {
    // Elegant gradient background
    coverPage.drawRectangle({ x: 0, y: 0, width: pg.width, height: pg.height, color: rgb(0.05, 0.08, 0.15) });
    // Decorative accent bar
    coverPage.drawRectangle({ x: pg.width * 0.1, y: pg.height * 0.52, width: pg.width * 0.8, height: 2, color: rgb(0.35, 0.55, 0.85) });
    coverPage.drawRectangle({ x: pg.width * 0.3, y: pg.height * 0.515, width: pg.width * 0.4, height: 1, color: rgb(0.5, 0.7, 0.95) });
  }

  // Dark overlay for text readability
  coverPage.drawRectangle({
    x: 0, y: 0, width: pg.width, height: pg.height,
    color: rgb(0.02, 0.05, 0.12), opacity: hasCover ? 0.5 : 0.05,
  });

  // Title on cover — centered, large
  const coverTitleSize = 32;
  const titleLines = wrapText(opts.title, pg.width - 100, serifBold, coverTitleSize).slice(0, 4);
  let ty = pg.height * 0.62;
  for (const line of titleLines) {
    const w = serifBold.widthOfTextAtSize(line, coverTitleSize);
    coverPage.drawText(line, { x: (pg.width - w) / 2, y: ty, size: coverTitleSize, font: serifBold, color: rgb(1, 1, 1) });
    ty -= coverTitleSize * 1.35;
  }

  // Subtitle
  if (opts.subtitle) {
    const subLines = wrapText(opts.subtitle, pg.width - 140, serifItalic, 13).slice(0, 2);
    ty -= 10;
    for (const line of subLines) {
      const w = serifItalic.widthOfTextAtSize(line, 13);
      coverPage.drawText(line, { x: (pg.width - w) / 2, y: ty, size: 13, font: serifItalic, color: rgb(0.85, 0.88, 0.95) });
      ty -= 18;
    }
  }

  // Org name at bottom
  const orgW = sans.widthOfTextAtSize(opts.orgName, 12);
  coverPage.drawText(opts.orgName, { x: (pg.width - orgW) / 2, y: 60, size: 12, font: sans, color: rgb(0.75, 0.8, 0.9) });

  // ── 2. HALF-TITLE PAGE (pro touch) ────────────────────────────
  const halfTitle = pdfDoc.addPage([pg.width, pg.height]);
  const htLines = wrapText(opts.title, pg.width - 160, serifBold, 22).slice(0, 3);
  let hty = pg.height * 0.55;
  for (const line of htLines) {
    const w = serifBold.widthOfTextAtSize(line, 22);
    halfTitle.drawText(line, { x: (pg.width - w) / 2, y: hty, size: 22, font: serifBold, color: rgb(0.12, 0.14, 0.2) });
    hty -= 30;
  }

  // ── 3. COPYRIGHT PAGE ─────────────────────────────────────────
  const copyrightPage = pdfDoc.addPage([pg.width, pg.height]);
  const year = new Date().getFullYear();
  const copyrightLines = [
    opts.title,
    '',
    `© ${year} ${opts.orgName}`,
    isFr ? 'Tous droits réservés.' : 'All rights reserved.',
    '',
    isFr ? 'Aucune partie de cet ouvrage ne peut être reproduite sans autorisation écrite.'
          : 'No part of this publication may be reproduced without written permission.',
    '',
    isFr ? `Généré par Siteviral AI Studio — ${new Date().toLocaleDateString('fr-FR')}`
          : `Generated by Siteviral AI Studio — ${new Date().toLocaleDateString('en-US')}`,
  ];
  let cy = pg.height - 120;
  for (const line of copyrightLines) {
    if (!line) { cy -= 14; continue; }
    copyrightPage.drawText(line, { x: marginOuter, y: cy, size: 9, font: serif, color: rgb(0.35, 0.38, 0.45) });
    cy -= 14;
  }

  // ── 4. TABLE OF CONTENTS (placeholder, will add links after chapters) ──
  const tocStartPage = pdfDoc.addPage([pg.width, pg.height]);
  // We'll draw TOC content after we know chapter page numbers

  // ── 5. CHAPTERS ───────────────────────────────────────────────
  for (let ci = 0; ci < chapters.length; ci++) {
    const chapter = chapters[ci];
    const chTitle = asText(chapter.title, `${chapterWord} ${ci + 1}`);

    // Chapter title page (each chapter starts on a new page)
    const titlePage = pdfDoc.addPage([pg.width, pg.height]);
    chapterPageRefs.push(pdfDoc.context.getObjectRef(titlePage.node)!);

    // Chapter number — small, elegant, centered
    const numLabel = `— ${ci + 1} —`;
    const numW = sans.widthOfTextAtSize(numLabel, 11);
    titlePage.drawText(numLabel, {
      x: (pg.width - numW) / 2, y: pg.height * 0.62,
      size: 11, font: sans, color: rgb(0.45, 0.5, 0.6),
    });

    // Decorative line
    const lineW = 80;
    titlePage.drawLine({
      start: { x: (pg.width - lineW) / 2, y: pg.height * 0.605 },
      end: { x: (pg.width + lineW) / 2, y: pg.height * 0.605 },
      thickness: 0.8, color: rgb(0.3, 0.5, 0.8),
    });

    // Chapter title — centered, large
    const ctLines = wrapText(chTitle, pg.width - 120, serifBold, 24).slice(0, 3);
    let cty = pg.height * 0.57;
    for (const line of ctLines) {
      const w = serifBold.widthOfTextAtSize(line, 24);
      titlePage.drawText(line, {
        x: (pg.width - w) / 2, y: cty, size: 24, font: serifBold, color: rgb(0.1, 0.12, 0.2),
      });
      cty -= 32;
    }

    // Chapter content pages
    let contentPage = pdfDoc.addPage([pg.width, pg.height]);
    let y = pg.height - marginTop;
    let pageInChapter = 1;
    const isEvenPage = (pageIndex: number) => pageIndex % 2 === 0;

    const getMarginLeft = () => marginInner; // simplified, always same

    // Parse HTML into structured blocks
    const blocks = htmlToBlocks(asText(chapter.content, ''));

    let isFirstParagraph = true;

    for (const block of blocks) {
      if (block.type === 'separator') {
        // Decorative separator
        if (y < marginBottom + 40) {
          contentPage = pdfDoc.addPage([pg.width, pg.height]);
          y = pg.height - marginTop;
          pageInChapter++;
        }
        const sepY = y - 8;
        const cx = getMarginLeft() + contentWidth / 2;
        contentPage.drawText('• • •', {
          x: cx - sans.widthOfTextAtSize('• • •', 10) / 2, y: sepY,
          size: 10, font: sans, color: rgb(0.6, 0.65, 0.72),
        });
        y -= 28;
        continue;
      }

      if (block.type === 'heading') {
        if (y < marginBottom + 60) {
          contentPage = pdfDoc.addPage([pg.width, pg.height]);
          y = pg.height - marginTop;
          pageInChapter++;
        }
        y -= 12; // extra space before heading
        const hLines = wrapText(block.text, contentWidth, serifBold, 14);
        for (const line of hLines) {
          contentPage.drawText(line, {
            x: getMarginLeft(), y, size: 14, font: serifBold, color: rgb(0.1, 0.13, 0.22),
          });
          y -= 20;
        }
        y -= 6;
        isFirstParagraph = true;
        continue;
      }

      if (block.type === 'quote') {
        if (y < marginBottom + 50) {
          contentPage = pdfDoc.addPage([pg.width, pg.height]);
          y = pg.height - marginTop;
          pageInChapter++;
        }
        y -= 8;
        // Quote bar
        const quoteMargin = getMarginLeft() + 18;
        const quoteWidth = contentWidth - 36;
        const qLines = wrapText(block.text, quoteWidth, serifItalic, bodyFontSize);
        const quoteTop = y + 4;
        for (const line of qLines) {
          if (y < marginBottom + 20) {
            contentPage = pdfDoc.addPage([pg.width, pg.height]);
            y = pg.height - marginTop;
            pageInChapter++;
          }
          contentPage.drawText(line, {
            x: quoteMargin, y, size: bodyFontSize, font: serifItalic, color: rgb(0.25, 0.28, 0.38),
          });
          y -= bodyLineHeight;
        }
        // Draw left bar for the quote
        contentPage.drawRectangle({
          x: getMarginLeft() + 6, y: y + bodyLineHeight - 2,
          width: 2.5, height: quoteTop - y - bodyLineHeight + 6,
          color: rgb(0.3, 0.5, 0.8),
        });
        y -= paragraphSpacing;
        continue;
      }

      if (block.type === 'bullet') {
        if (y < marginBottom + 30) {
          contentPage = pdfDoc.addPage([pg.width, pg.height]);
          y = pg.height - marginTop;
          pageInChapter++;
        }
        const bulletX = getMarginLeft() + 12;
        const bulletTextX = getMarginLeft() + 24;
        const bLines = wrapText(block.text, contentWidth - 24, serif, bodyFontSize);
        for (let li = 0; li < bLines.length; li++) {
          if (y < marginBottom + 20) {
            contentPage = pdfDoc.addPage([pg.width, pg.height]);
            y = pg.height - marginTop;
            pageInChapter++;
          }
          if (li === 0) {
            contentPage.drawText('•', {
              x: bulletX, y: y + 1, size: bodyFontSize + 2, font: sans, color: rgb(0.3, 0.5, 0.8),
            });
          }
          contentPage.drawText(bLines[li], {
            x: bulletTextX, y, size: bodyFontSize, font: serif, color: rgb(0.15, 0.18, 0.26),
          });
          y -= bodyLineHeight;
        }
        y -= 2;
        continue;
      }

      // Regular paragraph
      const indent = isFirstParagraph ? 0 : 24; // First paragraph no indent, others indented (book convention)
      const paraWidth = contentWidth - indent;
      const pLines = wrapText(block.text, paraWidth, serif, bodyFontSize);

      for (let li = 0; li < pLines.length; li++) {
        if (y < marginBottom + 20) {
          contentPage = pdfDoc.addPage([pg.width, pg.height]);
          y = pg.height - marginTop;
          pageInChapter++;
          // Running header on continuation pages
          contentPage.drawText(chTitle.length > 50 ? chTitle.slice(0, 47) + '...' : chTitle, {
            x: getMarginLeft(), y: pg.height - 40,
            size: 8, font: serifItalic, color: rgb(0.55, 0.58, 0.65),
          });
          contentPage.drawLine({
            start: { x: getMarginLeft(), y: pg.height - 44 },
            end: { x: getMarginLeft() + contentWidth, y: pg.height - 44 },
            thickness: 0.3, color: rgb(0.82, 0.85, 0.9),
          });
        }

        const x = getMarginLeft() + (li === 0 ? indent : 0);
        contentPage.drawText(pLines[li], {
          x, y, size: bodyFontSize, font: serif, color: rgb(0.12, 0.14, 0.22),
        });
        y -= bodyLineHeight;
      }

      y -= paragraphSpacing;
      isFirstParagraph = false;
    }
  }

  // ── 6. DRAW TABLE OF CONTENTS (now we know chapter pages) ─────
  const tocPageIndex = pdfDoc.getPages().indexOf(tocStartPage);
  let tocPages = [tocStartPage];
  let tocY = pg.height - marginTop;

  // TOC title
  const tocTitleW = serifBold.widthOfTextAtSize(tocLabel, 22);
  tocStartPage.drawText(tocLabel, {
    x: (pg.width - tocTitleW) / 2, y: tocY,
    size: 22, font: serifBold, color: rgb(0.1, 0.12, 0.2),
  });
  tocY -= 16;

  // Decorative line under TOC title
  tocStartPage.drawLine({
    start: { x: pg.width * 0.3, y: tocY },
    end: { x: pg.width * 0.7, y: tocY },
    thickness: 0.6, color: rgb(0.3, 0.5, 0.8),
  });
  tocY -= 30;

  let currentTocPage = tocStartPage;

  for (let ci = 0; ci < chapters.length; ci++) {
    if (tocY < marginBottom + 30) {
      currentTocPage = pdfDoc.insertPage(tocPageIndex + tocPages.length, [pg.width, pg.height]);
      tocPages.push(currentTocPage);
      tocY = pg.height - marginTop;
    }

    const chTitle = asText(chapters[ci].title, `${chapterWord} ${ci + 1}`);
    const numStr = `${ci + 1}`;
    const displayTitle = chTitle.length > 60 ? chTitle.slice(0, 57) + '...' : chTitle;

    // Chapter number
    currentTocPage.drawText(numStr, {
      x: marginOuter, y: tocY,
      size: 20, font: sansBold, color: rgb(0.3, 0.5, 0.8),
    });

    // Chapter title
    const titleX = marginOuter + 36;
    currentTocPage.drawText(displayTitle, {
      x: titleX, y: tocY,
      size: 12, font: serif, color: rgb(0.15, 0.18, 0.25),
    });

    // Dot leader
    const titleEnd = titleX + serif.widthOfTextAtSize(displayTitle, 12) + 8;
    const pageNumX = pg.width - marginOuter - 20;
    if (pageNumX > titleEnd + 20) {
      let dotX = titleEnd;
      while (dotX < pageNumX - 5) {
        currentTocPage.drawText('.', {
          x: dotX, y: tocY, size: 8, font: sans, color: rgb(0.75, 0.78, 0.82),
        });
        dotX += 5;
      }
    }

    // Create clickable annotation linking to chapter page
    if (chapterPageRefs[ci]) {
      try {
        const linkDict = pdfDoc.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [marginOuter, tocY - 4, pg.width - marginOuter, tocY + 16],
          Border: [0, 0, 0],
          Dest: [chapterPageRefs[ci], PDFName.of('Fit')],
        });
        const linkRef = pdfDoc.context.register(linkDict);
        const existingAnnots = currentTocPage.node.get(PDFName.of('Annots'));
        if (existingAnnots instanceof PDFArray) {
          existingAnnots.push(linkRef);
        } else {
          currentTocPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkRef]));
        }
      } catch (e) {
        console.warn('Could not create TOC link for chapter', ci + 1, e);
      }
    }

    tocY -= 28;
  }

  // ── 7. PAGE NUMBERS, HEADERS, FOOTERS, WATERMARK ──────────────
  const allPages = pdfDoc.getPages();
  const total = allPages.length;
  const generatedDate = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  allPages.forEach((p, index) => {
    const { width, height } = p.getSize();

    // Skip cover page for page numbers / watermark
    if (index === 0) return;

    // Subtle diagonal watermark (buyer-specific would be added at download time)
    p.drawText(opts.orgName.toUpperCase(), {
      x: width * 0.12, y: height * 0.4,
      size: 44, font: sans, color: rgb(0.92, 0.93, 0.96),
      rotate: degrees(38), opacity: 0.15,
    });

    // Footer line
    p.drawLine({
      start: { x: marginOuter, y: marginBottom - 12 },
      end: { x: width - marginOuter, y: marginBottom - 12 },
      thickness: 0.4, color: rgb(0.85, 0.87, 0.92),
    });

    // Footer left: book title (truncated)
    const footerTitle = opts.title.length > 40 ? opts.title.slice(0, 37) + '...' : opts.title;
    p.drawText(footerTitle, {
      x: marginOuter, y: marginBottom - 26,
      size: 8, font: serifItalic, color: rgb(0.5, 0.53, 0.6),
    });

    // Footer right: page number
    const pageLabel = `${index}`;  // Cover is 0, so index = page number
    const plW = sans.widthOfTextAtSize(pageLabel, 9);
    p.drawText(pageLabel, {
      x: width - marginOuter - plW, y: marginBottom - 26,
      size: 9, font: sans, color: rgb(0.45, 0.48, 0.55),
    });
  });

  return await pdfDoc.save();
}
