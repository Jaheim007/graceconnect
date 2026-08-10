/**
 * transcribe-source — turns an uploaded document, audio file, or handwritten
 * pages into plain text that feeds the existing course-from-document pipeline.
 *
 * Routing:
 *   document     → Gemini document extraction (unchanged)
 *   audio        → Gemini multimodal transcription
 *   notes_photo  → Gemini multimodal handwriting transcription
 *
 * There is NO video input and no URL fetching (YouTube/Facebook) — audio and
 * image/PDF uploads only.
 *
 * Uploaded audio is deleted from storage immediately after a successful
 * transcription; a scheduled cleanup job (cleanup-transcribe-media) removes any
 * leftover file under `transcribe/` older than 24 hours.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { consumeCreditsOrThrow, refundCreditsAsBonus } from '../_shared/credits.ts';
import {
  geminiTranscribePages,
  type PageInput,
  type TranscriptionMethod,
} from '../_shared/transcribe-vision.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_INLINE_BYTES = 18 * 1024 * 1024;       // Gemini inline cap (documents / images)
const MAX_HANDWRITING_PAGES = 20;                // page-count cap, consistent with document caps

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

  if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY not configured' }, 500);

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let userId: string | null = null;
  let creditDebited = 0;

  const refund = async () => {
    if (creditDebited > 0 && userId) {
      try {
        await refundCreditsAsBonus({ admin: db, userId, amount: creditDebited, source: 'transcribe_media', expiresInDays: 30 });
      } catch (e) { console.error('[transcribe-source] refund failed', e); }
    }
  };

  try {
    const body = await req.json();
    const { source_type, storage_path, storage_paths, project_id } = body as {
      source_type: string;
      storage_path?: string;
      storage_paths?: string[];
      project_id?: string;
    };

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY);
      const { data: { user } } = await anonClient.auth.getUser(token);
      userId = user?.id || null;
    }
    if (!userId) return json({ error: 'Not authenticated' }, 401);

    console.log('[transcribe-source] type:', source_type, 'paths:', (storage_paths?.length ?? (storage_path ? 1 : 0)));

    try {
      const debit = await consumeCreditsOrThrow({ admin: db, userId, actionKey: 'transcribe_media', tier: 'standard' });
      if (!('skipped' in debit)) creditDebited = debit.debited;
    } catch (e: any) {
      if (e?.status === 402) return json({ error: e.message }, 402);
      throw e;
    }

    const signedUrl = async (path: string, expires = 3600) => {
      const { data, error } = await db.storage.from('org-uploads').createSignedUrl(path, expires);
      if (error || !data?.signedUrl) throw new Error(`Could not access file: ${path}`);
      return data.signedUrl;
    };

    const downloadBase64 = async (path: string, maxBytes = MAX_INLINE_BYTES) => {
      const resp = await fetch(await signedUrl(path));
      const buf = await resp.arrayBuffer();
      if (buf.byteLength > maxBytes) {
        throw new Error(`File too large (max ${Math.round(maxBytes / (1024 * 1024))} MB): ${path}`);
      }
      return { base64: base64Encode(buf), bytes: buf.byteLength };
    };

    let transcribedText = '';
    let method: TranscriptionMethod | 'gemini' = 'gemini';
    let fallbackReason: string | null = null;
    const cleanupPaths: string[] = [];

    switch (source_type) {
      /* ─────────── Documents (unchanged behaviour) ─────────── */
      case 'document': {
        if (!storage_path) throw new Error('storage_path required for document source');
        const lower = storage_path.toLowerCase();
        let mimeType = 'application/pdf';
        if (lower.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (lower.endsWith('.doc')) mimeType = 'application/msword';
        else if (lower.endsWith('.txt')) mimeType = 'text/plain';

        const { base64 } = await downloadBase64(storage_path);
        if (mimeType === 'text/plain') {
          transcribedText = new TextDecoder('utf-8').decode(
            Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
          );
        } else {
          transcribedText = await geminiExtractDocument(GEMINI_API_KEY, base64, mimeType);
        }
        method = 'gemini';
        break;
      }

      /* ─────────── Audio → Gemini multimodal ─────────── */
      case 'audio': {
        if (!storage_path) throw new Error('storage_path required for audio source');
        cleanupPaths.push(storage_path);

        const { base64 } = await downloadBase64(storage_path);
        transcribedText = await geminiTranscribeAudio(GEMINI_API_KEY, base64, guessAudioMime(storage_path));
        method = 'gemini';
        break;
      }

      /* ─────────── Handwriting → Gemini multimodal ─────────── */
      case 'notes_photo': {
        const paths = (storage_paths?.length ? storage_paths : storage_path ? [storage_path] : []).filter(Boolean);
        if (!paths.length) throw new Error('storage_path(s) required for handwritten notes');
        if (paths.length > MAX_HANDWRITING_PAGES) {
          await refund();
          return json({
            ok: false,
            error: `Too many pages (${paths.length}). Maximum is ${MAX_HANDWRITING_PAGES} pages per book.`,
            credits_refunded: true,
          }, 422);
        }

        const pages: PageInput[] = [];
        for (const p of paths) {
          const { base64 } = await downloadBase64(p);
          pages.push({ base64, mimeType: guessImageMime(p) });
        }

        transcribedText = await geminiTranscribePages(GEMINI_API_KEY, pages);
        method = 'gemini';
        break;
      }


      default:
        throw new Error(`Unsupported source_type: ${source_type}`);
    }

    if (!transcribedText || transcribedText.trim().length < 10) {
      await refund();
      await purge(db, cleanupPaths);
      return json({
        ok: false,
        error: 'Could not extract meaningful text from the provided source. Please check the quality of the input and try again.',
        credits_refunded: creditDebited > 0,
      }, 422);
    }

    // Raw audio is not retained: delete it as soon as the transcript exists.
    await purge(db, cleanupPaths);

    const wordCount = transcribedText.split(/\s+/).filter(Boolean).length;

    if (project_id) {
      await db.from('ai_content_projects').update({
        data_json: { transcribed_text: transcribedText, source_type, word_count: wordCount, method },
      }).eq('id', project_id);
    }

    return json({ ok: true, text: transcribedText, word_count: wordCount, method, fallback_reason: fallbackReason });
  } catch (err) {
    console.error('[transcribe-source] ERROR:', err);
    await refund();
    return json({ error: String((err as Error)?.message || err), credits_refunded: creditDebited > 0 }, 500);
  }
});

/** Delete raw uploads (best effort). */
async function purge(db: any, paths: string[]) {
  if (!paths.length) return;
  try {
    await db.storage.from('org-uploads').remove(paths);
    console.log('[transcribe-source] purged raw upload(s):', paths.join(', '));
  } catch (e) {
    console.warn('[transcribe-source] purge failed (cleanup job will retry):', e);
  }
}

function guessAudioMime(path: string): string {
  const l = path.toLowerCase();
  if (l.endsWith('.mp3')) return 'audio/mp3';
  if (l.endsWith('.wav')) return 'audio/wav';
  if (l.endsWith('.m4a')) return 'audio/mp4';
  if (l.endsWith('.ogg')) return 'audio/ogg';
  if (l.endsWith('.aac')) return 'audio/aac';
  if (l.endsWith('.flac')) return 'audio/flac';
  return 'audio/mpeg';
}

function guessImageMime(path: string): string {
  const l = path.toLowerCase();
  if (l.endsWith('.png')) return 'image/png';
  if (l.endsWith('.webp')) return 'image/webp';
  if (l.endsWith('.heic')) return 'image/heic';
  if (l.endsWith('.pdf')) return 'application/pdf';
  return 'image/jpeg';
}

async function geminiInline(apiKey: string, prompt: string, base64Data: string, mimeType: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.1 },
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (data?.error) throw new Error(`Gemini error: ${data.error.message || data.error.status}`);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } finally {
    clearTimeout(timer);
  }
}

function geminiExtractDocument(apiKey: string, base64: string, mimeType: string) {
  return geminiInline(apiKey, `You are a professional document extraction assistant. Extract ALL text content from this document.

Rules:
- Preserve the original structure: headings, paragraphs, lists, tables
- Reproduce ALL content faithfully – do NOT summarize or skip sections
- Use ## headings to separate chapters or sections
- Correct obvious OCR artifacts but keep the original language
- Return ONLY the extracted text, clean and well-formatted`, base64, mimeType);
}

function geminiTranscribeAudio(apiKey: string, base64: string, mimeType: string) {
  return geminiInline(apiKey, `You are a professional transcription assistant. Transcribe this audio recording into well-structured text.

Rules:
- Organize the content with clear paragraphs and ## headings where appropriate
- Indicate speaker changes if there are several speakers
- Include ALL content — do not summarize
- Keep the original language
- Return ONLY the transcribed text`, base64, mimeType);
}
