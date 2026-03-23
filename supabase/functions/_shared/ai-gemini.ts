export async function geminiGenerateText(opts: {
  apiKey: string;
  model?: string;
  system?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const model = opts.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`;

  const body: any = {
    contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.7,
      maxOutputTokens: typeof opts.maxOutputTokens === 'number' ? opts.maxOutputTokens : 2048,
      ...(opts.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (opts.system) {
    body.system_instruction = { parts: [{ text: opts.system }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    const err = new Error(res.status === 429 ? 'Rate limit. Please retry.' : `Gemini error (${res.status})`);
    (err as any).status = res.status;
    (err as any).detail = t.slice(0, 800);
    throw err;
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export function extractJson(text: string): any | null {
  const cleaned = String(text)
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  const aStart = cleaned.indexOf('[');
  const aEnd = cleaned.lastIndexOf(']');
  if (aStart >= 0 && aEnd > aStart) {
    try {
      return JSON.parse(cleaned.slice(aStart, aEnd + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function extractInlineImage(parts: any[]): { base64: string; mimeType: string } | null {
  for (const p of parts || []) {
    const inline = p?.inlineData || p?.inline_data;
    if (inline?.data) {
      return { base64: inline.data as string, mimeType: inline.mimeType || inline.mime_type || 'image/png' };
    }
  }

  const txt = parts?.[0]?.text || '';
  const m = String(txt).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (m) return { mimeType: m[1], base64: m[2] };

  return null;
}

/** Generate image using Gemini Pro-level models via direct Google API (highest quality) */
export async function geminiProImageBase64(opts: {
  apiKey: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);

  // Pro-level models — use stable names first, then previews
  const candidateModels = [
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash-preview-04-17',
  ];

  let lastErr: any = null;

  try {
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const t = await res.text();
          const err = new Error(res.status === 429 ? 'Rate limit. Please retry.' : `Gemini Pro image error (${res.status})`);
          (err as any).status = res.status;
          (err as any).detail = t.slice(0, 800);
          (err as any).model = model;
          throw err;
        }

        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const image = extractInlineImage(parts);
        if (image) return image;

        const err = new Error('No image data returned by Gemini Pro');
        (err as any).status = 502;
        (err as any).model = model;
        throw err;
      } catch (err: any) {
        lastErr = err;
        const status = Number(err?.status || 0);
        const detail = String(err?.detail || err?.message || '').toLowerCase();
        const modelMissing = status === 404 || detail.includes('not found') || detail.includes('is not supported') || detail.includes('model');
        const retryable = status >= 500 || status === 0;

        if (status === 429 || status === 401 || status === 403 || status === 402) throw err;

        if (modelMissing || retryable) {
          console.warn(`[ai-gemini] Pro model ${err?.model || 'unknown'} failed (${status}), trying next model`);
          continue;
        }

        throw err;
      }
    }

    throw lastErr || new Error('Gemini Pro image generation failed');
  } finally {
    clearTimeout(id);
  }
}

/** Generate image using Gemini Flash-level models via direct Google API (fast, emergency fallback) */
export async function geminiGenerateImageBase64(opts: {
  apiKey: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);

  const candidateModels = [
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.0-flash-exp',
  ];

  let lastErr: any = null;

  try {
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const t = await res.text();
          const err = new Error(res.status === 429 ? 'Rate limit. Please retry.' : `Gemini image error (${res.status})`);
          (err as any).status = res.status;
          (err as any).detail = t.slice(0, 800);
          (err as any).model = model;
          throw err;
        }

        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const image = extractInlineImage(parts);
        if (image) return image;

        const err = new Error('No image data returned by Gemini');
        (err as any).status = 502;
        (err as any).model = model;
        throw err;
      } catch (err: any) {
        lastErr = err;
        const status = Number(err?.status || 0);
        const detail = String(err?.detail || err?.message || '').toLowerCase();
        const modelMissing = status === 404 || detail.includes('not found') || detail.includes('model');
        const retryable = status >= 500 || status === 0;

        if (status === 429 || status === 401 || status === 403 || status === 402) throw err;

        if (modelMissing || retryable) {
          console.warn(`[ai-gemini] model ${err?.model || 'unknown'} failed, trying next model`);
          continue;
        }

        throw err;
      }
    }

    throw lastErr || new Error('Gemini image generation failed');
  } finally {
    clearTimeout(id);
  }
}

/** Gemini generateContent with streaming response (returns raw Response for SSE passthrough) */
export async function geminiStreamResponse(opts: {
  apiKey: string;
  model?: string;
  system?: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<Response> {
  const model = opts.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${opts.apiKey}`;

  const contents = opts.messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = { contents };
  if (opts.system) {
    body.system_instruction = { parts: [{ text: opts.system }] };
  }

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => '');
    return new Response(JSON.stringify({ error: `Gemini stream error (${upstream.status})`, detail: t.slice(0, 200) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
