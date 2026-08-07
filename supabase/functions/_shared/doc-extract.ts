/**
 * Real text extraction per file type, for the document → course pipeline.
 *
 * Supported: PDF, DOCX, PPTX, TXT/MD.
 * Page / section markers are preserved inline as `[[page N]]` so the segmenter
 * can keep the original document order and quote real source excerpts.
 */
import { unzipSync, strFromU8 } from 'https://esm.sh/fflate@0.8.2';

/** Hard cost/time cap for the whole pipeline (see MAX_WORDS in the function). */
export const DOC_MAX_WORDS = 30_000; // ≈ 120 pages of prose
export const DOC_MAX_BYTES = 25 * 1024 * 1024; // 25 MB upload ceiling

export type DocKind = 'pdf' | 'docx' | 'pptx' | 'txt';

export function detectKind(fileName: string, mime?: string): DocKind | null {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') return 'txt';
  return null;
}

export function countWords(text: string): number {
  return (text.match(/\S+/g) || []).length;
}

function cleanup(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function xmlToText(xml: string): string {
  return cleanup(
    xml
      // paragraph / line breaks become newlines before tags are stripped
      .replace(/<\/w:p>|<\/a:p>|<w:br\s*\/>|<a:br\s*\/>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x?[0-9a-fA-F]+;/g, ' '),
  );
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import('https://esm.sh/unpdf@0.12.1');
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: false });
  const pages: string[] = Array.isArray(text) ? text : [String(text)];
  return cleanup(pages.map((p, i) => `[[page ${i + 1}]]\n${p}`).join('\n\n'));
}

function extractDocx(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  const doc = files['word/document.xml'];
  if (!doc) throw new Error('DOCX_UNREADABLE');
  return xmlToText(strFromU8(doc));
}

function extractPptx(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  const slideNames = Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/)![1]);
      const nb = Number(b.match(/slide(\d+)/)![1]);
      return na - nb;
    });
  if (slideNames.length === 0) throw new Error('PPTX_UNREADABLE');
  return cleanup(
    slideNames
      .map((n, i) => `[[page ${i + 1}]]\n${xmlToText(strFromU8(files[n]))}`)
      .join('\n\n'),
  );
}

export async function extractDocumentText(opts: {
  bytes: Uint8Array;
  fileName: string;
  mime?: string;
}): Promise<{ text: string; kind: DocKind; words: number }> {
  const kind = detectKind(opts.fileName, opts.mime);
  if (!kind) throw new Error('UNSUPPORTED_FORMAT');
  if (opts.bytes.byteLength > DOC_MAX_BYTES) throw new Error('FILE_TOO_LARGE');

  let text: string;
  if (kind === 'pdf') text = await extractPdf(opts.bytes);
  else if (kind === 'docx') text = extractDocx(opts.bytes);
  else if (kind === 'pptx') text = extractPptx(opts.bytes);
  else text = cleanup(new TextDecoder().decode(opts.bytes));

  if (countWords(text) < 80) throw new Error('NO_TEXT_FOUND');
  return { text, kind, words: countWords(text) };
}

// ─── Segmentation ────────────────────────────────────────────────────────────

export interface DocTopic {
  index: number;
  heading: string | null;
  text: string;
  /** page marker the topic starts on, when the format carries one */
  page: number | null;
}

const HEADING_RE = [
  /^#{1,4}\s+\S/, // markdown
  /^(chapter|chapitre|section|partie|part|module|lesson|leçon|unit|unité)\s+[\dIVXivx]+\b/i,
  /^\d+(\.\d+)*[.)]\s+\S/, // 1. / 1.2)
];

function looksLikeHeading(line: string): boolean {
  const l = line.trim();
  if (!l || l.length > 90) return false;
  if (HEADING_RE.some((re) => re.test(l))) return true;
  // Short, title-cased or upper-cased standalone line with no ending period
  const words = l.split(/\s+/);
  if (words.length <= 10 && !/[.!?;:]$/.test(l)) {
    const upper = l === l.toUpperCase() && /[A-ZÀ-Ý]/.test(l);
    if (upper) return true;
  }
  return false;
}

function stripMarkers(text: string): string {
  return text.replace(/\[\[page \d+\]\]/g, '').trim();
}

/**
 * Split extracted text into topics in ORIGINAL DOCUMENT ORDER.
 *
 * Strategy:
 *  1. Structural pass — split on detected headings.
 *  2. If a document has no usable structure (plain text, no headers), fall back
 *     to fixed-size word windows on paragraph boundaries (`targetWords`).
 *  3. Merge topics that are too small, split topics that are too large, then cap
 *     the total number of topics so the AI cost stays bounded.
 */
export function segmentIntoTopics(
  text: string,
  opts: { maxTopics: number; targetWords?: number } = { maxTopics: 12 },
): DocTopic[] {
  const targetWords = opts.targetWords ?? 700;
  const minWords = Math.round(targetWords * 0.35);
  const maxWords = targetWords * 2;

  const lines = text.split('\n');
  type Block = { heading: string | null; lines: string[]; page: number | null };
  const blocks: Block[] = [];
  let current: Block = { heading: null, lines: [], page: null };
  let page: number | null = null;

  for (const raw of lines) {
    const pageMatch = raw.match(/^\[\[page (\d+)\]\]$/);
    if (pageMatch) {
      page = Number(pageMatch[1]);
      if (current.page === null) current.page = page;
      continue;
    }
    if (looksLikeHeading(raw) && countWords(current.lines.join(' ')) >= minWords) {
      blocks.push(current);
      current = { heading: raw.trim().replace(/^#+\s*/, ''), lines: [], page };
      continue;
    }
    if (looksLikeHeading(raw) && current.lines.length === 0 && !current.heading) {
      current.heading = raw.trim().replace(/^#+\s*/, '');
      continue;
    }
    current.lines.push(raw);
  }
  if (current.lines.length) blocks.push(current);

  let topics: DocTopic[] = blocks
    .map((b, i) => ({
      index: i,
      heading: b.heading,
      text: stripMarkers(b.lines.join('\n')),
      page: b.page,
    }))
    .filter((t) => countWords(t.text) > 0);

  // No structure at all → window the whole document by paragraphs.
  if (topics.length <= 1) {
    const paragraphs = stripMarkers(text).split(/\n{2,}/).filter((p) => p.trim());
    const windows: string[] = [];
    let buf: string[] = [];
    for (const p of paragraphs) {
      buf.push(p);
      if (countWords(buf.join('\n\n')) >= targetWords) {
        windows.push(buf.join('\n\n'));
        buf = [];
      }
    }
    if (buf.length) windows.push(buf.join('\n\n'));
    topics = windows.map((t, i) => ({ index: i, heading: null, text: t, page: null }));
  }

  // Merge undersized neighbours (keeps order).
  const merged: DocTopic[] = [];
  for (const t of topics) {
    const prev = merged[merged.length - 1];
    if (prev && countWords(prev.text) < minWords) {
      prev.text = `${prev.text}\n\n${t.text}`.trim();
      if (!prev.heading) prev.heading = t.heading;
      continue;
    }
    merged.push({ ...t });
  }

  // Split oversized topics on paragraph boundaries.
  const sized: DocTopic[] = [];
  for (const t of merged) {
    if (countWords(t.text) <= maxWords) { sized.push(t); continue; }
    const paragraphs = t.text.split(/\n{2,}/);
    let buf: string[] = [];
    let part = 1;
    for (const p of paragraphs) {
      buf.push(p);
      if (countWords(buf.join('\n\n')) >= targetWords) {
        sized.push({ ...t, heading: t.heading ? `${t.heading} (${part})` : null, text: buf.join('\n\n') });
        buf = [];
        part++;
      }
    }
    if (buf.length) {
      sized.push({ ...t, heading: t.heading ? `${t.heading} (${part})` : null, text: buf.join('\n\n') });
    }
  }

  // Cap topic count: fold the overflow into the last allowed topic so no source
  // content is silently dropped, while AI calls stay bounded.
  let capped = sized;
  if (sized.length > opts.maxTopics) {
    capped = sized.slice(0, opts.maxTopics);
    const tail = sized.slice(opts.maxTopics).map((t) => t.text).join('\n\n');
    const last = capped[capped.length - 1];
    last.text = `${last.text}\n\n${tail}`;
  }

  return capped.map((t, i) => ({ ...t, index: i }));
}
