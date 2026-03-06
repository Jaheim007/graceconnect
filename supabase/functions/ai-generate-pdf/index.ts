import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, degrees, PDFPage, PDFFont, PDFName, PDFArray, PDFRef } from 'https://esm.sh/pdf-lib@1.17.1';

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
      update_product?: boolean; product_id?: string;
    };
    const { org_id, project_id, format, page_size, preview_only, title: directTitle, style: directStyle, cover_url: directCoverUrl, update_product, product_id: bodyProductId } = body;

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

    const [{ data: coverAsset }, { data: org }, { data: linkedProduct }] = await Promise.all([
      admin.from('ai_project_assets').select('file_url')
        .eq('project_id', project_id).eq('is_cover', true).maybeSingle(),
      admin.from('organizations').select('name').eq('id', org_id).maybeSingle(),
      admin.from('digital_products').select('id, cover_image_url')
        .eq('ai_project_id', project_id).eq('organization_id', org_id).maybeSingle(),
    ]);

    const resolvedCoverUrl = asText(coverAsset?.file_url, '')
      || asText(linkedProduct?.cover_image_url, '')
      || asText(directCoverUrl, '');

    const projectData = (project.structure_json || project.data_json || {}) as { chapters?: ChapterInput[] };
    const chapters = Array.isArray(projectData.chapters) ? projectData.chapters : [];

    const pdfBytes = await buildProfessionalPdf({
      title: asText(project.title, 'Document'),
      subtitle: asText(project.objective, ''),
      orgName: asText(org?.name, 'Siteviral'),
      language: asText(project.language, 'fr'),
      chapters,
      coverUrl: resolvedCoverUrl,
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

    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/org-uploads/${storagePath}`;
    if (update_product !== false) {
      await admin.from('digital_products')
        .update({ file_url: downloadUrl })
        .eq('ai_project_id', project_id)
        .eq('organization_id', org_id);
    }

    await admin.from('audit_logs').insert({
      user_id: user.id, action: 'studio.pdf_generated', resource_type: 'ai_content_project',
      resource_id: project_id, organization_id: org_id,
      metadata: { format: projectFormat, page_size: normalizedPageSize, asset_id: asset?.id },
    });

    return new Response(JSON.stringify({
      ok: true, asset_id: asset?.id,
      download_url: downloadUrl,
      format: projectFormat,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('ai-generate-pdf error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

// ══════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════
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
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '-').replace(/&ndash;/g, '-')
    .replace(/&hellip;/g, '...').replace(/&eacute;/g, 'e')
    .replace(/&egrave;/g, 'e').replace(/&agrave;/g, 'a')
    .replace(/&ccedil;/g, 'c').replace(/&ocirc;/g, 'o')
    .replace(/&ucirc;/g, 'u').replace(/&ecirc;/g, 'e')
    .replace(/&iuml;/g, 'i').replace(/&ouml;/g, 'o')
    .replace(/&#\d+;/g, ' ');
}

// ══════════════════════════════════════════════════════════════════════
// HTML → structured blocks
// ══════════════════════════════════════════════════════════════════════
type Block = { type: 'paragraph' | 'heading' | 'subheading' | 'quote' | 'bullet' | 'numbered' | 'separator'; text: string; index?: number };

function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  let remaining = html;

  // Extract elements in order using regex scanning
  const patterns: { re: RegExp; handler: (match: RegExpExecArray) => Block | null }[] = [
    { re: /<h1[^>]*>(.*?)<\/h1>/gi, handler: m => ({ type: 'heading', text: stripTags(m[1]) }) },
    { re: /<h2[^>]*>(.*?)<\/h2>/gi, handler: m => ({ type: 'heading', text: stripTags(m[1]) }) },
    { re: /<h3[^>]*>(.*?)<\/h3>/gi, handler: m => ({ type: 'subheading', text: stripTags(m[1]) }) },
    { re: /<h4[^>]*>(.*?)<\/h4>/gi, handler: m => ({ type: 'subheading', text: stripTags(m[1]) }) },
    { re: /<blockquote[^>]*>(.*?)<\/blockquote>/gi, handler: m => ({ type: 'quote', text: stripTags(m[1]) }) },
    { re: /<hr\s*\/?>/gi, handler: () => ({ type: 'separator', text: '' }) },
  ];

  // Process ordered lists
  remaining = remaining.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, inner) => {
    let idx = 1;
    inner.replace(/<li[^>]*>(.*?)<\/li>/gi, (_: string, content: string) => {
      blocks.push({ type: 'numbered', text: stripTags(content), index: idx++ });
      return '';
    });
    return '';
  });

  // Process unordered lists
  remaining = remaining.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, inner) => {
    inner.replace(/<li[^>]*>(.*?)<\/li>/gi, (_: string, content: string) => {
      blocks.push({ type: 'bullet', text: stripTags(content) });
      return '';
    });
    return '';
  });

  for (const { re, handler } of patterns) {
    remaining = remaining.replace(re, (full, ...args) => {
      const match = re.exec(full) || ([full, args[0]] as unknown as RegExpExecArray);
      const block = handler({ ...match, 0: full, 1: args[0] } as RegExpExecArray);
      if (block) blocks.push(block);
      return '';
    });
  }

  // Remaining paragraphs
  const withBreaks = remaining
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  decodeEntities(withBreaks)
    .split(/\n+/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 1)
    .forEach(text => blocks.push({ type: 'paragraph', text }));

  return blocks.length ? blocks : [{ type: 'paragraph', text: 'Contenu en cours de préparation.' }];
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

// ══════════════════════════════════════════════════════════════════════
// Text wrapping with proper character handling
// ══════════════════════════════════════════════════════════════════════
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const sanitized = text.replace(/\s+/g, ' ').trim();
  if (!sanitized) return [];
  const words = sanitized.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const safeWord = sanitizeForFont(word, font);
    const candidate = current ? `${current} ${safeWord}` : safeWord;
    try {
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) { current = candidate; continue; }
    } catch { current = candidate; continue; }
    if (current) lines.push(current);
    current = safeWord;
  }
  if (current) lines.push(current);
  return lines;
}

// Sanitize text to only include characters the font can render
function sanitizeForFont(text: string, font: PDFFont): string {
  let result = '';
  for (const char of text) {
    try {
      font.encodeText(char);
      result += char;
    } catch {
      // Replace unsupported characters with safe ASCII alternatives
      const code = char.charCodeAt(0);
      if (code === 0x2018 || code === 0x2019) result += "'";  // smart single quotes
      else if (code === 0x201C || code === 0x201D) result += '"';  // smart double quotes
      else if (code === 0x2014) result += '-';  // em dash
      else if (code === 0x2013) result += '-';  // en dash
      else if (code === 0x2026) result += '...';  // ellipsis
      else if (code === 0x2022) result += '-';  // bullet
      else result += ' ';
    }
  }
  return result;
}

function safeDrawText(page: PDFPage, text: string, opts: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb>; opacity?: number; rotate?: ReturnType<typeof degrees> }) {
  try {
    const safe = sanitizeForFont(text, opts.font);
    page.drawText(safe, opts);
  } catch {
    // Last resort: strip to ASCII
    const ascii = text.replace(/[^\x20-\x7E]/g, '');
    try { page.drawText(ascii, opts); } catch { /* skip this text entirely */ }
  }
}

// ══════════════════════════════════════════════════════════════════════
// Cover image
// ══════════════════════════════════════════════════════════════════════
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
    else if (ct.includes('jpeg') || ct.includes('jpg') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || ct.includes('image')) image = await pdfDoc.embedJpg(bytes);
    if (!image) return false;
    const pw = page.getWidth(), ph = page.getHeight();
    const dims = image.scale(1);
    const scale = Math.max(pw / dims.width, ph / dims.height);
    const w = dims.width * scale, h = dims.height * scale;
    page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    return true;
  } catch (e) { console.error('Cover image error:', e); return false; }
}

// ══════════════════════════════════════════════════════════════════════
// COLOR PALETTE — Elegant navy / gold / warm gray
// ══════════════════════════════════════════════════════════════════════
const C = {
  navy:       rgb(0.09, 0.11, 0.18),
  darkText:   rgb(0.10, 0.12, 0.18),
  bodyText:   rgb(0.14, 0.16, 0.22),
  lightText:  rgb(0.40, 0.43, 0.50),
  mutedText:  rgb(0.55, 0.58, 0.65),
  accent:     rgb(0.16, 0.32, 0.58),    // Deep blue accent
  accentGold: rgb(0.72, 0.58, 0.30),    // Gold accent
  rule:       rgb(0.75, 0.78, 0.82),
  ruleLight:  rgb(0.88, 0.89, 0.92),
  bgWarm:     rgb(0.97, 0.96, 0.94),    // Warm cream tint
  white:      rgb(1, 1, 1),
  watermark:  rgb(0.93, 0.94, 0.96),
  quoteLine:  rgb(0.16, 0.32, 0.58),
  bulletDot:  rgb(0.16, 0.32, 0.58),
  chapNum:    rgb(0.72, 0.58, 0.30),
};

// ══════════════════════════════════════════════════════════════════════
// PROFESSIONAL PDF BUILDER
// ══════════════════════════════════════════════════════════════════════
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
  pdfDoc.setProducer('Siteviral Publishing Engine');
  pdfDoc.setCreationDate(new Date());

  // Fonts
  const serif = await pdfDoc.embedFont('Times-Roman');
  const serifBold = await pdfDoc.embedFont('Times-Bold');
  const serifItalic = await pdfDoc.embedFont('Times-Italic');
  const serifBoldItalic = await pdfDoc.embedFont('Times-BoldItalic');
  const sans = await pdfDoc.embedFont('Helvetica');
  const sansBold = await pdfDoc.embedFont('Helvetica-Bold');

  const pg = PAGE_SIZES[opts.pageSize] || PAGE_SIZES.A4;
  const isKids = opts.format === 'kids';

  // ── LAYOUT CONSTANTS ──────────────────────────────────────────
  const M = {
    outer: 65,         // outer margin (generous)
    inner: 75,         // inner margin (binding side)
    top: 78,           // top margin
    bottom: 60,        // bottom margin
    headerY: 28,       // header distance from top edge
  };
  const contentWidth = pg.width - M.outer - M.inner;

  // Typography scale
  const T = {
    body: isKids ? 13.5 : 11.5,
    bodyLH: isKids ? 23 : 19.5,        // line height
    paraGap: isKids ? 12 : 10,         // paragraph spacing
    indent: 22,                         // first-line indent
    h2: 15,
    h3: 13,
    tocEntry: 11.5,
    footer: 8,
    header: 7.5,
    pageNum: 9,
    dropCapSize: 42,                    // drop cap size
  };

  const isFr = opts.language.startsWith('fr');
  const tocLabel = isFr ? 'Table des matières' : 'Table of Contents';
  const chapterWord = isFr ? 'Chapitre' : 'Chapter';
  const generatedDate = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const year = new Date().getFullYear();

  const chapters = opts.chapters.length
    ? opts.chapters
    : [{ title: isFr ? 'Introduction' : 'Introduction', content: isFr ? 'Aucun contenu disponible.' : 'No content available.' }];

  const chapterPageRefs: PDFRef[] = [];

  // ══════════════════════════════════════════════════════════════
  // 1. COVER PAGE
  // ══════════════════════════════════════════════════════════════
  const coverPage = pdfDoc.addPage([pg.width, pg.height]);
  const hasCover = await tryDrawCover(pdfDoc, coverPage, opts.coverUrl);

  if (!hasCover) {
    // Elegant editorial cover — no image
    coverPage.drawRectangle({ x: 0, y: 0, width: pg.width, height: pg.height, color: C.navy });

    // Top decorative band
    coverPage.drawRectangle({ x: 0, y: pg.height - 8, width: pg.width, height: 8, color: C.accentGold });

    // Bottom decorative band
    coverPage.drawRectangle({ x: 0, y: 0, width: pg.width, height: 4, color: C.accentGold });

    // Central accent line
    const lineY = pg.height * 0.53;
    coverPage.drawLine({
      start: { x: pg.width * 0.15, y: lineY }, end: { x: pg.width * 0.85, y: lineY },
      thickness: 1.2, color: C.accentGold,
    });
    // Thin companion line
    coverPage.drawLine({
      start: { x: pg.width * 0.25, y: lineY - 6 }, end: { x: pg.width * 0.75, y: lineY - 6 },
      thickness: 0.4, color: rgb(0.5, 0.42, 0.25),
    });

    // Title — large, white, serif
    const titleSize = Math.min(34, 34 * (20 / Math.max(opts.title.length, 20)));
    const titleLines = wrapText(opts.title, pg.width - 110, serifBold, titleSize).slice(0, 4);
    let ty = pg.height * 0.63;
    for (const line of titleLines) {
      const w = serifBold.widthOfTextAtSize(line, titleSize);
      safeDrawText(coverPage, line, { x: (pg.width - w) / 2, y: ty, size: titleSize, font: serifBold, color: C.white });
      ty -= titleSize * 1.4;
    }

    // Subtitle
    if (opts.subtitle) {
      const subLines = wrapText(opts.subtitle, pg.width - 150, serifItalic, 13).slice(0, 2);
      ty -= 8;
      for (const line of subLines) {
        const w = serifItalic.widthOfTextAtSize(line, 13);
        safeDrawText(coverPage, line, { x: (pg.width - w) / 2, y: ty, size: 13, font: serifItalic, color: rgb(0.80, 0.78, 0.72) });
        ty -= 19;
      }
    }

    // Author / Org name — bottom area, small caps feel
    const orgNameUpper = opts.orgName.toUpperCase();
    const orgW = sans.widthOfTextAtSize(orgNameUpper, 11);
    safeDrawText(coverPage, orgNameUpper, { x: (pg.width - orgW) / 2, y: 55, size: 11, font: sans, color: C.accentGold });
  }

  // ══════════════════════════════════════════════════════════════
  // 2. HALF-TITLE PAGE (verso of cover — elegant, minimal)
  // ══════════════════════════════════════════════════════════════
  const halfTitle = pdfDoc.addPage([pg.width, pg.height]);
  const htLines = wrapText(opts.title, pg.width - 160, serifBold, 22).slice(0, 3);
  let hty = pg.height * 0.55;
  for (const line of htLines) {
    const w = serifBold.widthOfTextAtSize(line, 22);
    safeDrawText(halfTitle, line, { x: (pg.width - w) / 2, y: hty, size: 22, font: serifBold, color: C.darkText });
    hty -= 30;
  }
  // Small ornamental separator
  halfTitle.drawLine({ start: { x: pg.width * 0.40, y: hty - 20 }, end: { x: pg.width * 0.60, y: hty - 20 }, thickness: 0.8, color: C.accentGold });
  halfTitle.drawCircle({ x: pg.width * 0.5, y: hty - 20, size: 2, color: C.accentGold });

  // ══════════════════════════════════════════════════════════════
  // 3. COPYRIGHT / COLOPHON PAGE
  // ══════════════════════════════════════════════════════════════
  const copyrightPage = pdfDoc.addPage([pg.width, pg.height]);
  const copyrightLines: { text: string; bold?: boolean; gap?: number }[] = [
    { text: opts.title, bold: true },
    { text: '', gap: 8 },
    { text: `(c) ${year} ${opts.orgName}` },
    { text: isFr ? 'Tous droits réservés.' : 'All rights reserved.' },
    { text: '', gap: 16 },
    { text: isFr ? 'Aucune partie de cet ouvrage ne peut être reproduite,' : 'No part of this publication may be reproduced,' },
    { text: isFr ? 'stockée ou transmise sous quelque forme que ce soit' : 'stored or transmitted in any form or by any means' },
    { text: isFr ? 'sans l\'autorisation écrite préalable de l\'éditeur.' : 'without the prior written permission of the publisher.' },
    { text: '', gap: 20 },
    { text: isFr ? `Personnalisé par ${opts.orgName}` : `Personalized by ${opts.orgName}`, bold: true },
    { text: '', gap: 8 },
    { text: isFr ? `Créé avec Siteviral AI Studio` : `Created with Siteviral AI Studio` },
    { text: generatedDate },
    { text: 'https://siteviral.com' },
    { text: '', gap: 24 },
    { text: isFr ? `Première édition — ${generatedDate}` : `First edition — ${generatedDate}` },
  ];

  let cy = pg.height - 140;
  for (const line of copyrightLines) {
    if (!line.text) { cy -= (line.gap || 10); continue; }
    const font = line.bold ? serifBold : serif;
    const size = line.bold ? 10.5 : 9.5;
    safeDrawText(copyrightPage, line.text, { x: M.outer, y: cy, size, font, color: C.lightText });
    cy -= 14;
  }

  // ══════════════════════════════════════════════════════════════
  // 4. DEDICATION / EPIGRAPH PAGE (adds class)
  // ══════════════════════════════════════════════════════════════
  const epiPage = pdfDoc.addPage([pg.width, pg.height]);
  // A tasteful epigraph adds publishing credibility
  const epigraphs = isFr
    ? ['"Un livre est un jardin que l\'on porte dans sa poche."', '- Proverbe arabe']
    : ['"A book is a garden carried in the pocket."', '- Arab Proverb'];
  const epiY = pg.height * 0.55;
  const eq = epigraphs[0];
  const eqLines = wrapText(eq, pg.width - 200, serifItalic, 13);
  let ey = epiY;
  for (const line of eqLines) {
    const w = serifItalic.widthOfTextAtSize(line, 13);
    safeDrawText(epiPage, line, { x: (pg.width - w) / 2, y: ey, size: 13, font: serifItalic, color: C.lightText });
    ey -= 20;
  }
  ey -= 8;
  const attrW = serif.widthOfTextAtSize(epigraphs[1], 10);
  safeDrawText(epiPage, epigraphs[1], { x: (pg.width - attrW) / 2, y: ey, size: 10, font: serif, color: C.mutedText });

  // ══════════════════════════════════════════════════════════════
  // 5. TABLE OF CONTENTS (drawn after chapters for page numbers)
  // ══════════════════════════════════════════════════════════════
  const tocStartPage = pdfDoc.addPage([pg.width, pg.height]);

  // ══════════════════════════════════════════════════════════════
  // 6. BLANK SEPARATOR PAGE before chapters (convention)
  // ══════════════════════════════════════════════════════════════
  pdfDoc.addPage([pg.width, pg.height]);

  // ══════════════════════════════════════════════════════════════
  // 7. CHAPTERS
  // ══════════════════════════════════════════════════════════════
  for (let ci = 0; ci < chapters.length; ci++) {
    const chapter = chapters[ci];
    const chTitle = asText(chapter.title, `${chapterWord} ${ci + 1}`);

    // ── CHAPTER OPENER PAGE ─────────────────────────────────
    const openerPage = pdfDoc.addPage([pg.width, pg.height]);
    chapterPageRefs.push(pdfDoc.context.getObjectRef(openerPage.node)!);

    // Elegant chapter number — gold, large
    const numLabel = `${chapterWord.toUpperCase()} ${ci + 1}`;
    const numW = sans.widthOfTextAtSize(numLabel, 10);
    safeDrawText(openerPage, numLabel, {
      x: (pg.width - numW) / 2, y: pg.height * 0.68,
      size: 10, font: sans, color: C.accentGold,
    });

    // Gold decorative line under chapter number
    const decoLineW = 50;
    openerPage.drawLine({
      start: { x: (pg.width - decoLineW) / 2, y: pg.height * 0.67 },
      end: { x: (pg.width + decoLineW) / 2, y: pg.height * 0.67 },
      thickness: 1, color: C.accentGold,
    });

    // Chapter title — centered, bold serif
    const chTitleSize = chTitle.length > 40 ? 20 : 24;
    const ctLines = wrapText(chTitle, pg.width - 130, serifBold, chTitleSize).slice(0, 3);
    let cty = pg.height * 0.62;
    for (const line of ctLines) {
      const w = serifBold.widthOfTextAtSize(line, chTitleSize);
      safeDrawText(openerPage, line, {
        x: (pg.width - w) / 2, y: cty, size: chTitleSize, font: serifBold, color: C.darkText,
      });
      cty -= chTitleSize * 1.4;
    }

    // Second decorative line under title
    openerPage.drawLine({
      start: { x: pg.width * 0.3, y: cty + 4 },
      end: { x: pg.width * 0.7, y: cty + 4 },
      thickness: 0.5, color: C.rule,
    });

    // ── CHAPTER CONTENT PAGES ───────────────────────────────
    let contentPage = pdfDoc.addPage([pg.width, pg.height]);
    let y = pg.height - M.top;
    let pageInChapter = 1;

    const blocks = htmlToBlocks(asText(chapter.content, ''));
    let isFirstParagraph = true;

    for (const block of blocks) {
      // ── Separator ──
      if (block.type === 'separator') {
        if (y < M.bottom + 50) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }
        const cx = M.inner + contentWidth / 2;
        // Three-dot separator (professional)
        safeDrawText(contentPage, '*    *    *', {
          x: cx - sans.widthOfTextAtSize('*    *    *', 10) / 2, y: y - 6,
          size: 10, font: sans, color: C.mutedText,
        });
        y -= 32;
        continue;
      }

      // ── Heading ──
      if (block.type === 'heading') {
        if (y < M.bottom + 70) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }
        y -= 18;
        const hLines = wrapText(block.text, contentWidth, serifBold, T.h2);
        for (const line of hLines) {
          safeDrawText(contentPage, line, { x: M.inner, y, size: T.h2, font: serifBold, color: C.accent });
          y -= T.h2 * 1.5;
        }
        // Thin rule under heading
        contentPage.drawLine({
          start: { x: M.inner, y: y + 6 },
          end: { x: M.inner + Math.min(contentWidth * 0.3, 100), y: y + 6 },
          thickness: 0.6, color: C.accentGold,
        });
        y -= 10;
        isFirstParagraph = true;
        continue;
      }

      // ── Subheading ──
      if (block.type === 'subheading') {
        if (y < M.bottom + 50) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }
        y -= 14;
        const shLines = wrapText(block.text, contentWidth, serifBoldItalic, T.h3);
        for (const line of shLines) {
          safeDrawText(contentPage, line, { x: M.inner, y, size: T.h3, font: serifBoldItalic, color: C.darkText });
          y -= T.h3 * 1.5;
        }
        y -= 6;
        isFirstParagraph = true;
        continue;
      }

      // ── Block quote ──
      if (block.type === 'quote') {
        if (y < M.bottom + 60) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }
        y -= 12;
        const quoteMargin = M.inner + 24;
        const quoteWidth = contentWidth - 48;
        const qLines = wrapText(block.text, quoteWidth, serifItalic, T.body);
        const quoteTop = y + 4;

        for (const line of qLines) {
          if (y < M.bottom + 20) {
            contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
            y = pg.height - M.top;
            pageInChapter++;
          }
          safeDrawText(contentPage, line, { x: quoteMargin, y, size: T.body, font: serifItalic, color: C.lightText });
          y -= T.bodyLH;
        }
        // Left accent bar
        contentPage.drawRectangle({
          x: M.inner + 10, y: y + T.bodyLH - 2,
          width: 3, height: quoteTop - y - T.bodyLH + 8,
          color: C.accentGold,
        });
        y -= T.paraGap + 4;
        continue;
      }

      // ── Bullet list ──
      if (block.type === 'bullet') {
        if (y < M.bottom + 30) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }
        const bulletX = M.inner + 14;
        const bulletTextX = M.inner + 28;
        const bLines = wrapText(block.text, contentWidth - 28, serif, T.body);
        for (let li = 0; li < bLines.length; li++) {
          if (y < M.bottom + 20) {
            contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
            y = pg.height - M.top;
            pageInChapter++;
          }
          if (li === 0) {
            // Draw a small filled circle as bullet
            contentPage.drawCircle({ x: bulletX + 2, y: y + 3.5, size: 2.5, color: C.bulletDot });
          }
          safeDrawText(contentPage, bLines[li], { x: bulletTextX, y, size: T.body, font: serif, color: C.bodyText });
          y -= T.bodyLH;
        }
        y -= 3;
        continue;
      }

      // ── Numbered list ──
      if (block.type === 'numbered') {
        if (y < M.bottom + 30) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }
        const numText = `${block.index || 1}.`;
        const numTextX = M.inner + 28;
        safeDrawText(contentPage, numText, { x: M.inner + 8, y, size: T.body, font: serifBold, color: C.accent });
        const nLines = wrapText(block.text, contentWidth - 28, serif, T.body);
        for (let li = 0; li < nLines.length; li++) {
          if (y < M.bottom + 20) {
            contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
            y = pg.height - M.top;
            pageInChapter++;
          }
          safeDrawText(contentPage, nLines[li], { x: numTextX, y, size: T.body, font: serif, color: C.bodyText });
          y -= T.bodyLH;
        }
        y -= 3;
        continue;
      }

      // ── Regular paragraph ─────────────────────────────────
      // DROP CAP for first paragraph of each chapter
      if (isFirstParagraph && block.text.length > 20) {
        if (y < M.bottom + 80) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }

        const firstChar = block.text[0].toUpperCase();
        const restText = block.text.slice(1);

        // Draw drop cap
        let dropCapDrawn = false;
        try {
          const dcSize = T.dropCapSize;
          const dcWidth = serifBold.widthOfTextAtSize(firstChar, dcSize);
          const dcHeight = dcSize * 0.75;
          safeDrawText(contentPage, firstChar, {
            x: M.inner, y: y - dcHeight + 10,
            size: dcSize, font: serifBold, color: C.accent,
          });

          // Wrap remaining text around drop cap
          const dcIndent = dcWidth + 8;
          const firstLineWidth = contentWidth - dcIndent;
          const dcLines = 3; // lines that wrap around the drop cap

          const allWords = restText.split(' ');
          const wrappedLines: string[] = [];
          let wordIdx = 0;

          // First N lines: narrower (wrapping around drop cap)
          for (let dl = 0; dl < dcLines && wordIdx < allWords.length; dl++) {
            let currentLine = '';
            const maxW = dl < dcLines ? firstLineWidth : contentWidth;
            while (wordIdx < allWords.length) {
              const safe = sanitizeForFont(allWords[wordIdx], serif);
              const candidate = currentLine ? `${currentLine} ${safe}` : safe;
              try {
                if (serif.widthOfTextAtSize(candidate, T.body) <= maxW) {
                  currentLine = candidate;
                  wordIdx++;
                  continue;
                }
              } catch { wordIdx++; continue; }
              break;
            }
            if (currentLine) wrappedLines.push(currentLine);
          }

          // Draw lines beside drop cap
          let dropY = y;
          for (let dl = 0; dl < wrappedLines.length; dl++) {
            safeDrawText(contentPage, wrappedLines[dl], {
              x: M.inner + dcIndent, y: dropY,
              size: T.body, font: serif, color: C.bodyText,
            });
            dropY -= T.bodyLH;
          }

          // Remaining text: full width
          let remainingText = '';
          for (let wi = wordIdx; wi < allWords.length; wi++) {
            remainingText += (remainingText ? ' ' : '') + allWords[wi];
          }
          if (remainingText) {
            const rLines = wrapText(remainingText, contentWidth, serif, T.body);
            for (const line of rLines) {
              if (dropY < M.bottom + 20) {
                contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
                dropY = pg.height - M.top;
                pageInChapter++;
              }
              safeDrawText(contentPage, line, { x: M.inner, y: dropY, size: T.body, font: serif, color: C.bodyText });
              dropY -= T.bodyLH;
            }
          }
          y = dropY - T.paraGap;
          dropCapDrawn = true;
        } catch {
          dropCapDrawn = false;
        }

        if (!dropCapDrawn) {
          // Fallback: regular paragraph
          const pLines = wrapText(block.text, contentWidth, serif, T.body);
          for (const line of pLines) {
            if (y < M.bottom + 20) {
              contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
              y = pg.height - M.top;
              pageInChapter++;
            }
            safeDrawText(contentPage, line, { x: M.inner, y, size: T.body, font: serif, color: C.bodyText });
            y -= T.bodyLH;
          }
          y -= T.paraGap;
        }

        isFirstParagraph = false;
        continue;
      }

      // Regular paragraph (not first)
      const indent = isFirstParagraph ? 0 : T.indent;
      const paraWidth = contentWidth - indent;
      const pLines = wrapText(block.text, paraWidth, serif, T.body);

      for (let li = 0; li < pLines.length; li++) {
        if (y < M.bottom + 20) {
          contentPage = addContentPage(pdfDoc, pg, M, chTitle, serifItalic, sans, contentWidth);
          y = pg.height - M.top;
          pageInChapter++;
        }
        const x = M.inner + (li === 0 ? indent : 0);
        safeDrawText(contentPage, pLines[li], { x, y, size: T.body, font: serif, color: C.bodyText });
        y -= T.bodyLH;
      }
      y -= T.paraGap;
      isFirstParagraph = false;
    }

    // ── End-of-chapter ornament ──
    if (y > M.bottom + 40) {
      y -= 20;
      const endOrnX = M.inner + contentWidth / 2;
      contentPage.drawLine({
        start: { x: endOrnX - 20, y }, end: { x: endOrnX + 20, y },
        thickness: 0.6, color: C.rule,
      });
      // Small diamond
      const dY = y;
      contentPage.drawCircle({ x: endOrnX, y: dY, size: 2, color: C.accentGold });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 8. DRAW TABLE OF CONTENTS (now we know chapter pages)
  // ══════════════════════════════════════════════════════════════
  const tocPageIndex = pdfDoc.getPages().indexOf(tocStartPage);
  let tocPages = [tocStartPage];
  let tocY = pg.height - M.top;

  // TOC title — elegant
  const tocTitleW = serifBold.widthOfTextAtSize(tocLabel, 22);
  safeDrawText(tocStartPage, tocLabel, {
    x: (pg.width - tocTitleW) / 2, y: tocY,
    size: 22, font: serifBold, color: C.darkText,
  });
  tocY -= 12;

  // Gold line under TOC title
  tocStartPage.drawLine({
    start: { x: pg.width * 0.3, y: tocY }, end: { x: pg.width * 0.7, y: tocY },
    thickness: 1, color: C.accentGold,
  });
  tocY -= 35;

  let currentTocPage = tocStartPage;

  for (let ci = 0; ci < chapters.length; ci++) {
    if (tocY < M.bottom + 35) {
      currentTocPage = pdfDoc.insertPage(tocPageIndex + tocPages.length, [pg.width, pg.height]);
      tocPages.push(currentTocPage);
      tocY = pg.height - M.top;
    }

    const chTitle = asText(chapters[ci].title, `${chapterWord} ${ci + 1}`);
    const numStr = `${ci + 1}`;
    const displayTitle = chTitle.length > 55 ? chTitle.slice(0, 52) + '...' : chTitle;

    // Chapter number — accent gold, bold
    safeDrawText(currentTocPage, numStr, {
      x: M.outer, y: tocY, size: 18, font: sansBold, color: C.accentGold,
    });

    // Chapter title
    const titleX = M.outer + 32;
    safeDrawText(currentTocPage, displayTitle, {
      x: titleX, y: tocY, size: T.tocEntry, font: serif, color: C.darkText,
    });

    // Dot leader
    const titleEnd = titleX + serif.widthOfTextAtSize(displayTitle, T.tocEntry) + 10;
    const pageNumX = pg.width - M.outer - 18;
    if (pageNumX > titleEnd + 20) {
      let dotX = titleEnd;
      while (dotX < pageNumX - 5) {
        safeDrawText(currentTocPage, '.', { x: dotX, y: tocY, size: 7, font: sans, color: C.ruleLight });
        dotX += 5;
      }
    }

    // Clickable annotation
    if (chapterPageRefs[ci]) {
      try {
        const linkDict = pdfDoc.context.obj({
          Type: 'Annot', Subtype: 'Link',
          Rect: [M.outer, tocY - 4, pg.width - M.outer, tocY + 16],
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

    tocY -= 30;
  }

  // ══════════════════════════════════════════════════════════════
  // 9. BACK MATTER — "About" / colophon page
  // ══════════════════════════════════════════════════════════════
  const backPage = pdfDoc.addPage([pg.width, pg.height]);
  let by = pg.height * 0.65;

  // Decorative line
  backPage.drawLine({
    start: { x: pg.width * 0.3, y: by + 20 }, end: { x: pg.width * 0.7, y: by + 20 },
    thickness: 0.8, color: C.accentGold,
  });

  const aboutTitle = isFr ? 'À propos de cette publication' : 'About This Publication';
  const atW = serifBold.widthOfTextAtSize(aboutTitle, 16);
  safeDrawText(backPage, aboutTitle, { x: (pg.width - atW) / 2, y: by, size: 16, font: serifBold, color: C.darkText });
  by -= 30;

  const aboutLines = isFr ? [
    `Ce livre a été créé et publié par ${opts.orgName}`,
    `grâce à la plateforme Siteviral AI Studio.`,
    '',
    `Siteviral AI Studio permet aux créateurs, auteurs,`,
    `entrepreneurs et organisations de produire des contenus`,
    `éditoriaux de qualité professionnelle, accessibles au monde entier.`,
    '',
    `Date de publication : ${generatedDate}`,
    '',
    `Découvrez plus sur siteviral.com`,
  ] : [
    `This book was created and published by ${opts.orgName}`,
    `using the Siteviral AI Studio platform.`,
    '',
    `Siteviral AI Studio empowers creators, authors,`,
    `entrepreneurs and organizations to produce professional-quality`,
    `editorial content accessible to the world.`,
    '',
    `Publication date: ${generatedDate}`,
    '',
    `Learn more at siteviral.com`,
  ];

  for (const line of aboutLines) {
    if (!line) { by -= 12; continue; }
    const lw = serif.widthOfTextAtSize(line, 10.5);
    safeDrawText(backPage, line, { x: (pg.width - lw) / 2, y: by, size: 10.5, font: serif, color: C.lightText });
    by -= 16;
  }

  // ══════════════════════════════════════════════════════════════
  // 10. PAGE NUMBERS, HEADERS, FOOTERS, WATERMARK
  // ══════════════════════════════════════════════════════════════
  const allPages = pdfDoc.getPages();

  allPages.forEach((p: PDFPage, index: number) => {
    const { width, height } = p.getSize();

    // Skip cover page
    if (index === 0) return;

    // ── Subtle watermark (org name, very light) ──
    safeDrawText(p, opts.orgName.toUpperCase(), {
      x: width * 0.1, y: height * 0.38,
      size: 48, font: sans, color: C.watermark,
      rotate: degrees(38), opacity: 0.08,
    });

    // ── Footer ──
    // Elegant thin line
    p.drawLine({
      start: { x: M.outer, y: M.bottom - 14 },
      end: { x: width - M.outer, y: M.bottom - 14 },
      thickness: 0.3, color: C.ruleLight,
    });

    // Footer left: book title (italic, small)
    const footerTitle = opts.title.length > 38 ? opts.title.slice(0, 35) + '...' : opts.title;
    safeDrawText(p, footerTitle, {
      x: M.outer, y: M.bottom - 28,
      size: T.footer, font: serifItalic, color: C.mutedText,
    });

    // Footer right: page number
    const pageLabel = `${index}`;
    const plW = sans.widthOfTextAtSize(pageLabel, T.pageNum);
    safeDrawText(p, pageLabel, {
      x: width - M.outer - plW, y: M.bottom - 28,
      size: T.pageNum, font: sans, color: C.lightText,
    });
  });

  return await pdfDoc.save();
}

// ── Helper: add a new content page with running header ────────────
function addContentPage(
  pdfDoc: any, pg: { width: number; height: number },
  M: { outer: number; inner: number; top: number; bottom: number },
  chTitle: string, serifItalic: PDFFont, sans: PDFFont, contentWidth: number,
): PDFPage {
  const p = pdfDoc.addPage([pg.width, pg.height]);

  // Running header: chapter title
  const truncTitle = chTitle.length > 50 ? chTitle.slice(0, 47) + '...' : chTitle;
  safeDrawText(p, truncTitle, {
    x: M.inner, y: pg.height - 38,
    size: 7.5, font: serifItalic, color: C.mutedText,
  });

  // Thin header line
  p.drawLine({
    start: { x: M.inner, y: pg.height - 42 },
    end: { x: M.inner + contentWidth, y: pg.height - 42 },
    thickness: 0.25, color: C.ruleLight,
  });

  return p;
}
