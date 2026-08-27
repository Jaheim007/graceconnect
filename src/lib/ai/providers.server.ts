// Server-only AI provider layer. Ported from supabase/functions/_shared/
// ai-gemini.ts / ai-openai.ts / ai-fallback.ts (text path).
// TEXT: Gemini first → OpenAI fallback. Keys are read by the caller's handler.

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

export async function geminiGenerateText(opts: {
  apiKey: string;
  model?: string;
  system?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}): Promise<string> {
  const model = opts.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`;
  const controller = typeof opts.timeoutMs === 'number' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), opts.timeoutMs) : null;

  const body: any = {
    contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.7,
      maxOutputTokens: typeof opts.maxOutputTokens === 'number' ? opts.maxOutputTokens : 2048,
      ...(opts.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (opts.system) body.system_instruction = { parts: [{ text: opts.system }] };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (!res.ok) {
      const t = await res.text();
      const err: any = new Error(
        res.status === 429 ? 'Rate limit. Please retry.' : `Gemini error (${res.status})`,
      );
      err.status = res.status;
      err.detail = t.slice(0, 800);
      throw err;
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      const err: any = new Error('Gemini request timed out');
      err.status = 504;
      throw err;
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function openaiChat(opts: {
  apiKey: string;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
}): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      ...(opts.responseFormatJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    const err: any = new Error(
      res.status === 429 ? 'Rate limit. Please retry.' : `OpenAI error (${res.status})`,
    );
    err.status = res.status;
    err.detail = t.slice(0, 800);
    throw err;
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

/** User-side / billing failures must not trigger provider fallback. */
function shouldNotFallback(err: any): boolean {
  const status = err?.status;
  return status === 402 || status === 401 || status === 403;
}

export async function aiGenerateText(opts: {
  geminiKey: string;
  openaiKey?: string;
  model?: string;
  system?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}): Promise<string> {
  try {
    return await geminiGenerateText({
      apiKey: opts.geminiKey,
      model: opts.model || 'gemini-2.5-flash',
      system: opts.system,
      prompt: opts.prompt,
      temperature: opts.temperature,
      maxOutputTokens: opts.maxOutputTokens,
      jsonMode: opts.jsonMode,
    });
  } catch (geminiErr: any) {
    if (shouldNotFallback(geminiErr)) throw geminiErr;
    console.warn(
      '[ai-fallback] Gemini text failed, falling back to OpenAI:',
      geminiErr?.message?.slice(0, 200),
    );
  }

  const openaiKey = opts.openaiKey || process.env['OPENAI_API_KEY'];
  if (!openaiKey) throw new Error('Gemini failed and no OpenAI key available for fallback');

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (opts.system) messages.push({ role: 'system', content: opts.system });
  messages.push({ role: 'user', content: opts.prompt });

  return await openaiChat({
    apiKey: openaiKey,
    model: 'gpt-4o-mini',
    messages,
    temperature: opts.temperature,
    maxTokens: opts.maxOutputTokens,
    responseFormatJson: opts.jsonMode,
  });
}
