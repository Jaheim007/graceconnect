/**
 * Handwriting transcription helpers.
 *
 * Primary  : Google Cloud Vision DOCUMENT_TEXT_DETECTION (images + PDF)
 * Fallback : Gemini multimodal transcription (same bytes, existing GEMINI_API_KEY)
 *
 * Both return the transcribed text plus the method label so the UI can show
 * "Transcribed via Cloud Vision" or "Transcribed via Gemini (fallback)".
 */

export type TranscriptionMethod = 'cloud_vision' | 'gemini_fallback' | 'deepgram';

const VISION_TIMEOUT_MS = 60_000;
/** Cloud Vision sync files:annotate accepts at most 5 pages per request. */
export const VISION_PDF_PAGE_LIMIT = 5;

export interface PageInput {
  base64: string;
  mimeType: string;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Cloud Vision DOCUMENT_TEXT_DETECTION over one or more images. */
export async function visionTranscribeImages(apiKey: string, pages: PageInput[]): Promise<string> {
  const requests = pages.map((p) => ({
    image: { content: p.base64 },
    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
    imageContext: { languageHints: ['fr', 'en'] },
  }));

  const res = await fetchWithTimeout(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requests }) },
    VISION_TIMEOUT_MS,
  );

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(`Cloud Vision error ${res.status}: ${JSON.stringify(data?.error || data).slice(0, 300)}`);
  }

  const parts: string[] = [];
  for (const r of data?.responses || []) {
    if (r?.error) throw new Error(`Cloud Vision page error: ${JSON.stringify(r.error).slice(0, 200)}`);
    const text = r?.fullTextAnnotation?.text || '';
    if (text.trim()) parts.push(text.trim());
  }

  const out = parts.join('\n\n');
  if (out.trim().length < 10) throw new Error('Cloud Vision returned no readable text');
  return out;
}

/** Cloud Vision DOCUMENT_TEXT_DETECTION over a scanned PDF (first N pages). */
export async function visionTranscribePdf(apiKey: string, base64Pdf: string, maxPages = VISION_PDF_PAGE_LIMIT): Promise<string> {
  const pages = Array.from({ length: maxPages }, (_, i) => i + 1);
  const res = await fetchWithTimeout(
    `https://vision.googleapis.com/v1/files:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          inputConfig: { content: base64Pdf, mimeType: 'application/pdf' },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          pages,
        }],
      }),
    },
    VISION_TIMEOUT_MS,
  );

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(`Cloud Vision PDF error ${res.status}: ${JSON.stringify(data?.error || data).slice(0, 300)}`);
  }

  const first = data?.responses?.[0];
  if (first?.error) throw new Error(`Cloud Vision PDF page error: ${JSON.stringify(first.error).slice(0, 200)}`);

  const text = (first?.responses || [])
    .map((r: any) => r?.fullTextAnnotation?.text || '')
    .filter((s: string) => s.trim())
    .join('\n\n');

  if (text.trim().length < 10) throw new Error('Cloud Vision returned no readable text from PDF');
  return text;
}

const HANDWRITING_PROMPT = `You are an expert handwriting transcription assistant. Read and transcribe ALL handwritten or printed text visible in the attached page(s).

Rules:
- Transcribe faithfully — do NOT summarize, translate, or add commentary
- Keep the original language
- Preserve structure: paragraphs, headings (## Heading), bullet points, numbered lists
- If several pages are attached, transcribe them in order
- If a word is partially illegible, give your best interpretation in [brackets]
- Return ONLY the transcribed text`;

/** Gemini multimodal fallback for handwriting (images or PDF pages). */
export async function geminiTranscribePages(apiKey: string, pages: PageInput[]): Promise<string> {
  const parts: any[] = [{ text: HANDWRITING_PROMPT }];
  for (const p of pages) parts.push({ inlineData: { mimeType: p.mimeType, data: p.base64 } });

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { maxOutputTokens: 16384, temperature: 0.1 } }),
    },
    120_000,
  );

  const data = await res.json().catch(() => null);
  if (data?.error) throw new Error(`Gemini error: ${data.error.message || data.error.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (text.trim().length < 10) throw new Error('Gemini returned no readable text');
  return text;
}
