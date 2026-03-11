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

export async function geminiGenerateImageBase64(opts: {
  apiKey: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);

  try {
    // Use Gemini 2.0 Flash with image output modality
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${opts.apiKey}`;

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
      throw err;
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];

    for (const p of parts) {
      const inline = p?.inlineData || p?.inline_data;
      if (inline?.data) {
        return { base64: inline.data as string, mimeType: inline.mimeType || inline.mime_type || 'image/png' };
      }
    }

    // Fallback: check for data URL in text
    const txt = parts?.[0]?.text || '';
    const m = String(txt).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      return { mimeType: m[1], base64: m[2] };
    }

    throw new Error('No image data returned by Gemini');
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
