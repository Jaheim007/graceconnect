import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { consumeCreditsOrThrow, refundCreditsAsBonus } from '../_shared/credits.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_INLINE_BYTES = 18 * 1024 * 1024; // 18 MB – Gemini inline limit ~20 MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { source_type, url, storage_path, project_id } = body;
    console.log('[transcribe-source] source_type:', source_type, 'url:', url?.substring(0, 60), 'storage_path:', storage_path?.substring(0, 60));

    // Auth check
    const authHeader = req.headers.get('Authorization');
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    let userId: string | null = null;
    let creditDebited = 0;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_KEY);
      const { data: { user } } = await anonClient.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Debit credits for transcription (will be refunded if transcription fails)
    try {
      const debitResult = await consumeCreditsOrThrow({ admin: db, userId, actionKey: 'transcribe_media', tier: 'standard' });
      if (!('skipped' in debitResult)) creditDebited = debitResult.debited;
    } catch (e: any) {
      if (e?.status === 402) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw e;
    }

    let transcribedText = '';

    switch (source_type) {
      case 'youtube': {
        if (!url) throw new Error('URL required for YouTube source');
        
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
        if (!ytMatch) throw new Error('Invalid YouTube URL');
        
        const videoId = ytMatch[1];
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log('[transcribe-source] YouTube video:', videoUrl, 'id:', videoId);

        // ===== METHOD 1: Fetch real captions via Innertube API =====
        try {
          console.log('[transcribe-source] Attempting Innertube captions...');
          transcribedText = await fetchYouTubeCaptions(videoId);
          console.log('[transcribe-source] Innertube captions result length:', transcribedText.length);
        } catch (e) {
          console.log('[transcribe-source] Innertube captions failed:', String(e).substring(0, 300));
        }

        // ===== METHOD 2: Invidious captions fallback =====
        if (!transcribedText || transcribedText.length < 50) {
          try {
            console.log('[transcribe-source] Falling back to Invidious captions...');
            transcribedText = await fetchYouTubeCaptionsViaInvidious(videoId);
            console.log('[transcribe-source] Invidious captions result length:', transcribedText.length);
          } catch (e) {
            console.log('[transcribe-source] Invidious captions failed:', String(e).substring(0, 300));
          }
        }

        // ===== METHOD 3: Gemini with YouTube URL (use gemini-2.0-flash which handles video URLs better) =====
        if (!transcribedText || transcribedText.length < 50) {
          try {
            console.log('[transcribe-source] Falling back to Gemini video processing...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180_000);
            
            // Use gemini-2.0-flash-exp for video — it has native video understanding
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: `You are a professional transcription assistant. Visit and transcribe ALL spoken content from this YouTube video: https://www.youtube.com/watch?v=${videoId}

Rules:
- Return ONLY the transcribed text, well-formatted with clear paragraphs
- If the video covers multiple topics, organize them with descriptive headings (## Heading)
- Preserve the speaker's tone and key phrases
- Include all important details, examples, and anecdotes mentioned
- If there are multiple speakers, indicate speaker changes with "**Speaker 1:**", "**Speaker 2:**", etc.
- Minimum output: 500 words (transcribe everything, don't summarize)
- Language: transcribe in the ORIGINAL language of the video` },
                  ],
                }],
                generationConfig: { maxOutputTokens: 16384, temperature: 0.1 },
              }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const data = await res.json();
            console.log('[transcribe-source] Gemini video response status:', res.status);

            if (data?.error) {
              console.log('[transcribe-source] Gemini video error:', JSON.stringify(data.error).substring(0, 200));
            }

            transcribedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('[transcribe-source] Gemini video result length:', transcribedText.length);
          } catch (e) {
            console.log('[transcribe-source] Gemini video failed:', String(e).substring(0, 200));
          }
        }

        // ===== METHOD 4: Final failure =====
        if (!transcribedText || transcribedText.length < 50) {
          console.log('[transcribe-source] All YouTube transcription methods failed — refunding credits');
          if (creditDebited > 0) {
            try { await refundCreditsAsBonus({ admin: db, userId, amount: creditDebited, source: 'transcribe_media', expiresInDays: 30 }); } catch (re) { console.error('[transcribe-source] Refund failed:', re); }
          }
          throw new Error('Could not extract transcription from this video. Please try another YouTube link or upload the audio file directly.');
        }
        break;
      }

      case 'facebook_video': {
        if (!url) throw new Error('URL required for Facebook video source');
        transcribedText = await transcribeWithGemini(GEMINI_API_KEY, {
          prompt: `You are a content transcription assistant. Extract and transcribe all spoken content from this Facebook video.
          Return ONLY the transcribed text, well-formatted with paragraphs.
          Minimum output: 500 words. URL: ${url}`,
        });
        break;
      }

      case 'document': {
        if (!storage_path) throw new Error('storage_path required for document source');
        console.log('[transcribe-source] Processing document:', storage_path);

        const { data: signedData, error: signErr } = await db.storage
          .from('org-uploads')
          .createSignedUrl(storage_path, 3600);
        if (signErr || !signedData?.signedUrl) throw new Error('Could not access document file');

        const docResp = await fetch(signedData.signedUrl);
        const docBuffer = await docResp.arrayBuffer();
        
        if (docBuffer.byteLength > MAX_INLINE_BYTES) {
          throw new Error('Document too large (max 18 MB). Please use a smaller file.');
        }

        const base64Doc = base64Encode(docBuffer);
        
        // Detect MIME type
        const lowerPath = storage_path.toLowerCase();
        let mimeType = 'application/pdf';
        if (lowerPath.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (lowerPath.endsWith('.doc')) mimeType = 'application/msword';
        else if (lowerPath.endsWith('.txt')) mimeType = 'text/plain';

        console.log('[transcribe-source] Document size:', docBuffer.byteLength, 'mime:', mimeType);

        // For .txt files, just read the text directly
        if (mimeType === 'text/plain') {
          const decoder = new TextDecoder('utf-8');
          transcribedText = decoder.decode(docBuffer);
        } else {
          transcribedText = await transcribeWithGeminiInline(GEMINI_API_KEY, {
            prompt: `You are a professional document extraction assistant. Extract ALL text content from this document.

Rules:
- Preserve the original structure: headings, paragraphs, lists, tables
- Reproduce ALL content faithfully – do NOT summarize or skip sections
- If there are tables, reproduce them as formatted text
- If the document has chapters or sections, use ## headings to separate them
- Correct obvious OCR artifacts but keep the original language
- Minimum output: the FULL document text
- Return ONLY the extracted text, clean and well-formatted`,
            base64Data: base64Doc,
            mimeType,
          });
        }
        break;
      }

      case 'audio': {
        if (!storage_path) throw new Error('storage_path required for audio source');
        console.log('[transcribe-source] Processing audio:', storage_path);
        
        const { data: signedData, error: signErr } = await db.storage
          .from('org-uploads')
          .createSignedUrl(storage_path, 3600);
        if (signErr || !signedData?.signedUrl) throw new Error('Could not access audio file');

        const audioResp = await fetch(signedData.signedUrl);
        const audioBuffer = await audioResp.arrayBuffer();

        if (audioBuffer.byteLength > MAX_INLINE_BYTES) {
          throw new Error('Audio file too large (max 18 MB). Please use a shorter or compressed audio file.');
        }

        const base64Audio = base64Encode(audioBuffer);
        const mimeType = guessMimeType(storage_path, 'audio');

        console.log('[transcribe-source] Audio size:', audioBuffer.byteLength, 'mime:', mimeType);

        transcribedText = await transcribeWithGeminiInline(GEMINI_API_KEY, {
          prompt: `You are a professional transcription assistant. Transcribe this audio recording into well-structured text.

Rules:
- Organize the content with clear paragraphs and headings where appropriate
- If there are multiple speakers, indicate speaker changes
- Preserve key phrases, quotes, and specific terminology
- Include ALL content — do not summarize or skip sections
- Minimum output: 300 words
- Return ONLY the transcribed text, clean and well-formatted`,
          base64Data: base64Audio,
          mimeType,
        });
        break;
      }

      case 'notes_photo': {
        if (!storage_path) throw new Error('storage_path required for notes photo');
        console.log('[transcribe-source] Processing notes photo:', storage_path);
        
        const { data: imgSigned, error: imgErr } = await db.storage
          .from('org-uploads')
          .createSignedUrl(storage_path, 3600);
        if (imgErr || !imgSigned?.signedUrl) throw new Error('Could not access image file');

        const imgResp = await fetch(imgSigned.signedUrl);
        const imgBuffer = await imgResp.arrayBuffer();
        const base64Img = base64Encode(imgBuffer);
        const imgMime = storage_path.endsWith('.png') ? 'image/png' 
          : storage_path.endsWith('.webp') ? 'image/webp'
          : 'image/jpeg';

        transcribedText = await transcribeWithGeminiInline(GEMINI_API_KEY, {
          prompt: `You are an expert OCR and text extraction assistant. Read and transcribe ALL handwritten or printed text visible in this image.

Rules:
- Organize the text logically with paragraphs and headings if applicable
- Preserve the original structure, meaning and organization of the notes
- If there are bullet points, numbered lists, or diagrams with labels, reproduce them
- Correct obvious spelling mistakes but keep the original language
- Return ONLY the transcribed text, clean and well-formatted
- If some text is partially illegible, include your best interpretation in [brackets]`,
          base64Data: base64Img,
          mimeType: imgMime,
        });
        break;
      }

      default:
        throw new Error(`Unknown source_type: ${source_type}`);
    }

    console.log('[transcribe-source] Final text length:', transcribedText?.length || 0);

    if (!transcribedText || transcribedText.trim().length < 10) {
      // Refund credits — transcription produced no usable content
      if (creditDebited > 0) {
        try { await refundCreditsAsBonus({ admin: db, userId, amount: creditDebited, source: 'transcribe_media', expiresInDays: 30 }); } catch (re) { console.error('[transcribe-source] Refund failed:', re); }
      }
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Could not extract meaningful text from the provided source. Please try with a different source or check the quality of the input.',
        credits_refunded: creditDebited > 0,
      }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const wordCount = transcribedText.split(/\s+/).filter(Boolean).length;

    if (project_id) {
      await db.from('ai_content_projects').update({
        data_json: { transcribed_text: transcribedText, source_type, word_count: wordCount },
      }).eq('id', project_id);
    }

    return new Response(JSON.stringify({
      ok: true,
      text: transcribedText,
      word_count: wordCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[transcribe-source] ERROR:', err);
    // Note: credits already refunded in specific failure paths above.
    // For unexpected errors, we also refund here.
    // userId and creditDebited may not be defined if error happened early
    if (typeof creditDebited === 'number' && creditDebited > 0 && userId) {
      try { await refundCreditsAsBonus({ admin: db, userId, amount: creditDebited, source: 'transcribe_media', expiresInDays: 30 }); } catch (_) { /* best effort */ }
    }
    return new Response(JSON.stringify({ error: String(err), credits_refunded: typeof creditDebited === 'number' && creditDebited > 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function guessMimeType(path: string, category: 'audio' | 'document'): string {
  const lower = path.toLowerCase();
  if (category === 'audio') {
    if (lower.endsWith('.mp3')) return 'audio/mp3';
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.m4a')) return 'audio/mp4';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    if (lower.endsWith('.aac')) return 'audio/aac';
    if (lower.endsWith('.flac')) return 'audio/flac';
    if (lower.endsWith('.wma')) return 'audio/x-ms-wma';
    return 'audio/mpeg';
  }
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  return 'text/plain';
}

async function transcribeWithGemini(apiKey: string, opts: { prompt: string }): Promise<string> {
  // Try Gemini first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.1 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data?.error) {
      console.error('[transcribe-source] Gemini text error:', JSON.stringify(data.error).substring(0, 300));
      throw new Error(`Gemini error: ${data.error.message || data.error.status}`);
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) return text;
    throw new Error('Empty Gemini response');
  } catch (geminiErr: any) {
    console.warn('[transcribe-source] Gemini text failed, trying OpenAI fallback:', geminiErr?.message?.slice(0, 200));
  }

  // Fallback to OpenAI
  const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_KEY) return '';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: opts.prompt }],
      temperature: 0.1,
      max_tokens: 16384,
    }),
  });
  if (!res.ok) return '';
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function transcribeWithGeminiInline(apiKey: string, opts: { prompt: string; base64Data: string; mimeType: string }): Promise<string> {
  // Try Gemini first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: opts.prompt },
            { inlineData: { mimeType: opts.mimeType, data: opts.base64Data } },
          ],
        }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.1 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data?.error) {
      console.error('[transcribe-source] Gemini inline error:', JSON.stringify(data.error).substring(0, 300));
      throw new Error(`Gemini inline error: ${data.error.message || data.error.status}`);
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) return text;
    throw new Error('Empty Gemini inline response');
  } catch (geminiErr: any) {
    console.warn('[transcribe-source] Gemini inline failed, trying OpenAI fallback:', geminiErr?.message?.slice(0, 200));
  }

  // Fallback to OpenAI with base64 content (only for images, audio not supported via chat)
  const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_KEY) return '';

  // For images, we can use GPT-4o vision
  const isImage = opts.mimeType.startsWith('image/');
  if (isImage) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: opts.prompt },
            { type: 'image_url', image_url: { url: `data:${opts.mimeType};base64,${opts.base64Data}` } },
          ],
        }],
        max_tokens: 16384,
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  // For audio, use OpenAI Whisper
  const isAudio = opts.mimeType.startsWith('audio/');
  if (isAudio) {
    try {
      const audioBytes = Uint8Array.from(atob(opts.base64Data), c => c.charCodeAt(0));
      const ext = opts.mimeType.includes('mp3') ? 'mp3' : opts.mimeType.includes('wav') ? 'wav' : opts.mimeType.includes('mp4') || opts.mimeType.includes('m4a') ? 'm4a' : 'mp3';
      const blob = new Blob([audioBytes], { type: opts.mimeType });
      const form = new FormData();
      form.append('file', blob, `audio.${ext}`);
      form.append('model', 'whisper-1');

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}` },
        body: form,
      });
      if (!res.ok) return '';
      const data = await res.json();
      return data?.text || '';
    } catch (e) {
      console.error('[transcribe-source] OpenAI Whisper fallback error:', e);
      return '';
    }
  }

  // For other types (PDF etc.), use text-only prompt
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: opts.prompt }],
      max_tokens: 16384,
    }),
  });
  if (!res.ok) return '';
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * Fetch YouTube captions by scraping the watch page HTML.
 * This is more reliable than Innertube API calls which get blocked.
 */
async function fetchYouTubeCaptions(videoId: string): Promise<string> {
  // METHOD A: Scrape watch page for captions data
  try {
    console.log('[transcribe-source] Scraping YouTube watch page for captions...');
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageRes = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!pageRes.ok) throw new Error(`Watch page returned ${pageRes.status}`);
    const html = await pageRes.text();

    // Extract captions from ytInitialPlayerResponse
    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (!playerMatch) throw new Error('Could not find ytInitialPlayerResponse');

    const playerData = JSON.parse(playerMatch[1]);
    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No caption tracks in page data');
    }

    console.log('[transcribe-source] Found caption tracks from page:', captionTracks.map((t: any) => `${t.languageCode} (${t.kind || 'manual'})`).join(', '));

    // Prefer manual captions over ASR
    const selectedTrack = captionTracks.find((t: any) => t.kind !== 'asr') || captionTracks[0];
    const captionText = await fetchAndParseCaptionTrack(selectedTrack);

    if (captionText && captionText.length >= 50) {
      const videoTitle = playerData?.videoDetails?.title || 'YouTube Video';
      return formatTranscription(captionText, videoTitle);
    }
  } catch (e) {
    console.log('[transcribe-source] Page scraping failed:', String(e).substring(0, 200));
  }

  // METHOD B: Innertube API with multiple clients
  const clientConfigs = [
    {
      clientName: 'WEB',
      clientVersion: '2.20241126.01.00',
      apiKey: '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
    },
    {
      clientName: 'ANDROID',
      clientVersion: '19.44.38',
      apiKey: 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
      userAgent: 'com.google.android.youtube/19.44.38 (Linux; U; Android 14) gzip',
    },
    {
      clientName: 'MWEB',
      clientVersion: '2.20241126.01.00',
      apiKey: '',
      userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36',
    },
  ];

  for (const cfg of clientConfigs) {
    try {
      const url = cfg.apiKey
        ? `https://www.youtube.com/youtubei/v1/player?key=${cfg.apiKey}&prettyPrint=false`
        : 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

      const playerRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': cfg.userAgent },
        body: JSON.stringify({
          context: {
            client: { hl: 'fr', gl: 'FR', clientName: cfg.clientName, clientVersion: cfg.clientVersion },
          },
          videoId,
        }),
      });

      if (!playerRes.ok) {
        console.log(`[transcribe-source] Innertube ${cfg.clientName} returned ${playerRes.status}`);
        continue;
      }

      const playerData = await playerRes.json();
      const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!captionTracks || captionTracks.length === 0) {
        console.log(`[transcribe-source] Innertube ${cfg.clientName}: no caption tracks`);
        continue;
      }

      console.log(`[transcribe-source] Innertube ${cfg.clientName} found ${captionTracks.length} tracks`);
      const selectedTrack = captionTracks.find((t: any) => t.kind !== 'asr') || captionTracks[0];
      const captionText = await fetchAndParseCaptionTrack(selectedTrack);

      if (captionText && captionText.length >= 50) {
        const videoTitle = playerData?.videoDetails?.title || 'YouTube Video';
        return formatTranscription(captionText, videoTitle);
      }
    } catch (e) {
      console.log(`[transcribe-source] Innertube ${cfg.clientName} error:`, String(e).substring(0, 150));
    }
  }

  throw new Error('No caption tracks available for this video');
}

async function fetchAndParseCaptionTrack(track: any): Promise<string> {
  let captionUrl = track.baseUrl;

  // Try JSON3 first
  const json3Url = captionUrl + (captionUrl.includes('?') ? '&' : '?') + 'fmt=json3';
  try {
    const res = await fetch(json3Url);
    if (res.ok) {
      const json3 = await res.json();
      const events = json3?.events || [];
      const segments: string[] = [];
      for (const event of events) {
        if (event.segs) {
          const line = event.segs.map((s: any) => s.utf8 || '').join('').trim();
          if (line && line !== '\n') segments.push(line);
        }
      }
      const text = segments.join(' ');
      if (text.length >= 20) return text;
    }
  } catch { /* fall through to XML */ }

  // Fallback to XML
  try {
    const res = await fetch(captionUrl);
    if (res.ok) {
      const xmlText = await res.text();
      const textMatches = xmlText.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi);
      const segments: string[] = [];
      for (const match of textMatches) {
        const text = decodeEntities(match[1]).replace(/<[^>]+>/g, '').trim();
        if (text) segments.push(text);
      }
      return segments.join(' ');
    }
  } catch { /* ignore */ }

  return '';
}

function formatTranscription(text: string, title: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');
  const paragraphs: string[] = [];
  for (let i = 0; i < words.length; i += 200) {
    paragraphs.push(words.slice(i, i + 200).join(' '));
  }
  return `## ${title}\n\n${paragraphs.join('\n\n')}`;
}

async function fetchYouTubeCaptionsViaInvidious(videoId: string): Promise<string> {
  const instances = [
    'https://vid.puffyan.us',
    'https://invidious.fdn.fr',
    'https://y.com.sb',
    'https://inv.tux.pizza',
    'https://invidious.protokoll-11.dev',
    'https://inv.nadeko.net',
    'https://iv.ggtyler.dev',
  ];

  let lastError = 'No available Invidious instance';

  for (const base of instances) {
    try {
      const tracksRes = await fetch(`${base}/api/v1/captions/${videoId}`);
      if (!tracksRes.ok) {
        lastError = `${base} tracks returned ${tracksRes.status}`;
        continue;
      }

      const tracksData = await tracksRes.json();
      const tracks = tracksData?.captions || [];
      if (!Array.isArray(tracks) || tracks.length === 0) {
        lastError = `${base} no caption tracks`;
        continue;
      }

      // Prefer French or English, then fallback to first available track
      const selected =
        tracks.find((t: any) => String(t.languageCode || '').toLowerCase().startsWith('fr')) ||
        tracks.find((t: any) => String(t.languageCode || '').toLowerCase().startsWith('en')) ||
        tracks[0];

      const label = selected?.label;
      if (!label) {
        lastError = `${base} track missing label`;
        continue;
      }

      const subtitleUrl = `${base}/api/v1/captions/${videoId}?label=${encodeURIComponent(label)}`;
      const subtitleRes = await fetch(subtitleUrl);
      if (!subtitleRes.ok) {
        lastError = `${base} subtitles returned ${subtitleRes.status}`;
        continue;
      }

      const raw = await subtitleRes.text();
      const parsed = parseSubtitlePayload(raw);

      if (!parsed || parsed.length < 20) {
        lastError = `${base} empty subtitle payload`;
        continue;
      }

      return parsed;
    } catch (err) {
      lastError = `${base} ${(err as Error)?.message || String(err)}`;
    }
  }

  throw new Error(lastError);
}

function parseSubtitlePayload(payload: string): string {
  // 1) JSON shape: [{text,start,dur,...}] or {events:[...]}
  try {
    const parsed = JSON.parse(payload);

    if (Array.isArray(parsed)) {
      const lines = parsed
        .map((row: any) => decodeEntities(String(row?.text || '')))
        .map((t: string) => t.trim())
        .filter(Boolean);
      if (lines.length) return lines.join(' ');
    }

    if (Array.isArray(parsed?.events)) {
      const lines: string[] = [];
      for (const ev of parsed.events) {
        if (Array.isArray(ev?.segs)) {
          const line = ev.segs.map((s: any) => decodeEntities(String(s?.utf8 || ''))).join('').trim();
          if (line) lines.push(line);
        }
      }
      if (lines.length) return lines.join(' ');
    }
  } catch {
    // ignore JSON parse errors and try XML/VTT parsing
  }

  // 2) XML timedtext
  const xmlMatches = payload.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi);
  const xmlLines: string[] = [];
  for (const match of xmlMatches) {
    const text = decodeEntities(match[1]).replace(/<[^>]+>/g, '').trim();
    if (text) xmlLines.push(text);
  }
  if (xmlLines.length) return xmlLines.join(' ');

  // 3) VTT/SRT fallback (strip indexes/timestamps/headers)
  const vttLines = payload
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('WEBVTT') && !line.startsWith('NOTE'))
    .filter((line) => !/^\d+$/.test(line))
    .filter((line) => !line.includes('-->'))
    .map((line) => decodeEntities(line).replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);

  return vttLines.join(' ');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&nbsp;/g, ' ');
}
