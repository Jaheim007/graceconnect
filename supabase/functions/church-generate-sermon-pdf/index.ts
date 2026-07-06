// church-generate-sermon-pdf: Generates a PDF from a sermon variant (or transcript)
// and stores it in the church-sermons bucket, then inserts a church_sermon_pdfs row.
// Auth: church owner only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Convert unicode chars pdf-lib's WinAnsi fonts can't render into ASCII fallbacks.
function sanitize(text: string): string {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[…]/g, '...')
    .replace(/[•·]/g, '-')
    .replace(/\u00A0/g, ' ')
    // strip any remaining non-latin1 characters
    .replace(/[^\x00-\xFF]/g, '');
}

function wrap(text: string, font: any, size: number, maxWidth: number): string[] {
  const paragraphs = text.split(/\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(''); continue; }
    const words = para.split(/\s+/);
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > maxWidth) {
        if (cur) lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

function variantToText(v: any): string {
  if (!v) return '';
  const c = v.content || {};
  if (typeof c === 'string') return c;
  // Common shapes from church-generate-variant
  if (c.notes) {
    const parts: string[] = [];
    if (c.title) parts.push(`# ${c.title}`);
    if (c.intro) parts.push(c.intro);
    if (Array.isArray(c.points)) {
      c.points.forEach((p: any, i: number) => {
        parts.push(`\n${i + 1}. ${p.heading || p.title || ''}`);
        if (p.body || p.content) parts.push(p.body || p.content);
        if (Array.isArray(p.scriptures)) parts.push('References: ' + p.scriptures.join(', '));
      });
    }
    if (c.conclusion) parts.push(`\nConclusion:\n${c.conclusion}`);
    if (Array.isArray(c.application) || Array.isArray(c.applications)) {
      parts.push('\nApplication:');
      (c.application || c.applications).forEach((a: string, i: number) => parts.push(`- ${a}`));
    }
    return parts.join('\n\n');
  }
  if (Array.isArray(c.chapters)) {
    // ebook shape
    const parts: string[] = [];
    if (c.title) parts.push(`# ${c.title}`);
    if (c.subtitle) parts.push(c.subtitle);
    c.chapters.forEach((ch: any, i: number) => {
      parts.push(`\nChapter ${i + 1}: ${ch.title || ''}`);
      parts.push(ch.body || ch.content || '');
    });
    return parts.join('\n\n');
  }
  // Fallback: pretty-print
  return JSON.stringify(c, null, 2);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const b = await req.json();
    const sermonId = String(b.sermon_id || '');
    const variantId = b.variant_id ? String(b.variant_id) : null;
    const kind = String(b.kind || 'notes'); // 'notes' | 'ebook' | 'transcript' | 'study'
    const priceInput = Number(b.price ?? 0);
    const currency = String(b.currency || 'XOF').toUpperCase();
    const isFree = b.is_free === undefined ? priceInput <= 0 : !!b.is_free;

    if (!sermonId) return json({ error: 'sermon_id required' }, 400);

    const db = createClient(SUPABASE_URL, SERVICE);
    const { data: sermon } = await db
      .from('church_sermons')
      .select('*, church:church_providers!inner(id, user_id, name, slug)')
      .eq('id', sermonId)
      .maybeSingle();
    if (!sermon) return json({ error: 'Sermon not found' }, 404);
    if ((sermon as any).church.user_id !== user.id) return json({ error: 'Forbidden' }, 403);

    let bodyText = '';
    let sourceTitle = sermon.title || 'Sermon';
    let variant: any = null;
    if (variantId) {
      const { data: v } = await db.from('church_sermon_variants').select('*').eq('id', variantId).eq('sermon_id', sermonId).maybeSingle();
      if (!v) return json({ error: 'Variant not found' }, 404);
      variant = v;
      bodyText = variantToText(v);
    } else if (kind === 'transcript') {
      bodyText = sermon.transcript || '';
    } else {
      return json({ error: 'variant_id or kind=transcript required' }, 400);
    }
    if (!bodyText.trim()) return json({ error: 'Empty content' }, 400);

    // Build PDF
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const PAGE_W = 612, PAGE_H = 792;
    const MARGIN = 54;
    const MAX_W = PAGE_W - MARGIN * 2;
    const LINE = 15;
    const BODY_SIZE = 11;

    let page = pdf.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;

    // Cover header
    const churchName = sanitize((sermon as any).church.name || '');
    const titleText = sanitize(sourceTitle);
    page.drawText(sanitize('SiteViral Church'), { x: MARGIN, y, size: 9, font, color: rgb(0.45, 0.45, 0.5) });
    y -= 20;
    page.drawText(titleText.slice(0, 80), { x: MARGIN, y, size: 22, font: fontBold, color: rgb(0.08, 0.08, 0.12) });
    y -= 26;
    const meta = [churchName, sermon.preacher, sermon.series].filter(Boolean).map(sanitize).join(' · ');
    if (meta) { page.drawText(meta.slice(0, 110), { x: MARGIN, y, size: 10, font, color: rgb(0.4, 0.4, 0.45) }); y -= 24; }
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.85) });
    y -= 24;

    const lines = wrap(sanitize(bodyText), font, BODY_SIZE, MAX_W);
    for (const line of lines) {
      if (y < MARGIN + LINE) {
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
      const isHeading = line.startsWith('# ') || line.startsWith('Chapter ');
      const text = line.startsWith('# ') ? line.slice(2) : line;
      page.drawText(text, {
        x: MARGIN,
        y,
        size: isHeading ? 14 : BODY_SIZE,
        font: isHeading ? fontBold : font,
        color: rgb(0.1, 0.1, 0.15),
      });
      y -= isHeading ? LINE + 4 : LINE;
    }

    // Footer on each page
    const pageCount = pdf.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const p = pdf.getPage(i);
      p.drawText(sanitize(`${churchName} · siteviral.com · Page ${i + 1} / ${pageCount}`), {
        x: MARGIN, y: 24, size: 8, font, color: rgb(0.55, 0.55, 0.6),
      });
    }

    const pdfBytes = await pdf.save();

    // Store
    const pdfId = crypto.randomUUID();
    const storagePath = `${(sermon as any).church.id}/pdfs/${sermon.id}/${pdfId}.pdf`;
    const upload = await db.storage.from('church-sermons').upload(storagePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (upload.error) return json({ error: `Upload failed: ${upload.error.message}` }, 500);

    const finalPrice = isFree ? 0 : Math.max(0, priceInput);
    const inferredTitle = variant?.content?.title || `${sourceTitle} — ${kind}`;

    const { data: row, error: insErr } = await db.from('church_sermon_pdfs').insert({
      id: pdfId,
      sermon_id: sermon.id,
      church_id: (sermon as any).church.id,
      variant_id: variant?.id || null,
      kind,
      title: String(b.title || inferredTitle).slice(0, 200),
      description: b.description ? String(b.description).slice(0, 1000) : null,
      storage_path: storagePath,
      page_count: pageCount,
      file_size_bytes: pdfBytes.length,
      is_free: isFree,
      price: finalPrice,
      currency,
      is_published: false,
    }).select().single();

    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, pdf: row });
  } catch (e: any) {
    console.error('[church-generate-sermon-pdf] error', e);
    return json({ error: e?.message || 'Internal error' }, 500);
  }
});
