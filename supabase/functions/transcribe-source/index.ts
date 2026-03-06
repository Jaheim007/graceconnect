import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * transcribe-source — Converts video/audio/image sources to text for the writing wizard.
 * 
 * Supports:
 *   - YouTube video URL → transcript via Gemini
 *   - Facebook video URL → transcript via Gemini
 *   - Audio file (uploaded to storage) → transcript via Gemini
 *   - Image of handwritten notes (OCR) → text via Gemini
 * 
 * Input: { source_type: 'youtube' | 'facebook_video' | 'audio' | 'notes_photo', url?: string, storage_path?: string, project_id?: string }
 * Output: { ok: true, text: string, word_count: number }
 */
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

    // Auth check
    const authHeader = req.headers.get('Authorization');
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    let userId: string | null = null;
    
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

    let transcribedText = '';

    switch (source_type) {
      case 'youtube': {
        if (!url) throw new Error('URL required for YouTube source');
        transcribedText = await transcribeWithGemini(GEMINI_API_KEY, {
          prompt: `You are a content transcription assistant. Extract and transcribe all spoken content from this YouTube video. 
          Return ONLY the transcribed text, well-formatted with paragraphs. 
          If the video has multiple topics, organize them with headings.
          URL: ${url}`,
          type: 'url',
          url,
        });
        break;
      }

      case 'facebook_video': {
        if (!url) throw new Error('URL required for Facebook video source');
        transcribedText = await transcribeWithGemini(GEMINI_API_KEY, {
          prompt: `You are a content transcription assistant. Extract and transcribe all spoken content from this Facebook video.
          Return ONLY the transcribed text, well-formatted with paragraphs.
          URL: ${url}`,
          type: 'url',
          url,
        });
        break;
      }

      case 'audio': {
        if (!storage_path) throw new Error('storage_path required for audio source');
        // Get signed URL for the audio file
        const { data: signedData, error: signErr } = await db.storage
          .from('uploads')
          .createSignedUrl(storage_path, 3600);
        if (signErr || !signedData?.signedUrl) throw new Error('Could not access audio file');

        // Download audio and send to Gemini
        const audioResp = await fetch(signedData.signedUrl);
        const audioBuffer = await audioResp.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
        const mimeType = storage_path.endsWith('.mp3') ? 'audio/mp3' 
          : storage_path.endsWith('.wav') ? 'audio/wav'
          : storage_path.endsWith('.m4a') ? 'audio/mp4'
          : storage_path.endsWith('.ogg') ? 'audio/ogg'
          : 'audio/mpeg';

        transcribedText = await transcribeWithGeminiInline(GEMINI_API_KEY, {
          prompt: `Transcribe this audio recording into well-structured text. 
          Organize the content with clear paragraphs. 
          If there are multiple speakers, indicate speaker changes.
          Return ONLY the transcribed text.`,
          base64Data: base64Audio,
          mimeType,
        });
        break;
      }

      case 'notes_photo': {
        if (!storage_path) throw new Error('storage_path required for notes photo');
        // Get signed URL for the image
        const { data: imgSigned, error: imgErr } = await db.storage
          .from('uploads')
          .createSignedUrl(storage_path, 3600);
        if (imgErr || !imgSigned?.signedUrl) throw new Error('Could not access image file');

        const imgResp = await fetch(imgSigned.signedUrl);
        const imgBuffer = await imgResp.arrayBuffer();
        const base64Img = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
        const imgMime = storage_path.endsWith('.png') ? 'image/png' : 'image/jpeg';

        transcribedText = await transcribeWithGeminiInline(GEMINI_API_KEY, {
          prompt: `You are an OCR assistant. Read and transcribe ALL handwritten or printed text visible in this image.
          Organize the text logically with paragraphs and headings if applicable.
          Preserve the original structure and meaning.
          Return ONLY the transcribed text, clean and well-formatted.`,
          base64Data: base64Img,
          mimeType: imgMime,
        });
        break;
      }

      default:
        throw new Error(`Unknown source_type: ${source_type}`);
    }

    const wordCount = transcribedText.split(/\s+/).filter(Boolean).length;

    // Save transcription to project if project_id provided
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
    console.error('transcribe-source error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/** Call Gemini with a URL-based prompt */
async function transcribeWithGemini(apiKey: string, opts: { prompt: string; type: string; url: string }): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: opts.prompt },
        ],
      }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
    }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/** Call Gemini with inline binary data (audio/image) */
async function transcribeWithGeminiInline(apiKey: string, opts: { prompt: string; base64Data: string; mimeType: string }): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: opts.prompt },
          { inlineData: { mimeType: opts.mimeType, data: opts.base64Data } },
        ],
      }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
    }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
