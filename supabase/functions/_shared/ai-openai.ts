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
    const err = new Error(res.status === 429 ? 'Rate limit. Please retry.' : `OpenAI error (${res.status})`);
    (err as any).status = res.status;
    (err as any).detail = t.slice(0, 800);
    throw err;
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

export async function openaiStreamSse(opts: {
  apiKey: string;
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}): Promise<Response> {
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => '');
    return new Response(JSON.stringify({ error: `OpenAI error (${upstream.status})`, detail: t.slice(0, 200) }), {
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

/** Generate an image using OpenAI DALL-E 3 and return base64 */
export async function openaiGenerateImageBase64(opts: {
  apiKey: string;
  prompt: string;
  size?: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: opts.prompt,
        n: 1,
        size: opts.size || '1024x1024',
        output_format: 'png',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const t = await res.text();
      const err = new Error(res.status === 429 ? 'Rate limit. Please retry.' : `OpenAI image error (${res.status})`);
      (err as any).status = res.status;
      (err as any).detail = t.slice(0, 800);
      throw err;
    }

    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data returned by OpenAI');

    return { base64: b64, mimeType: 'image/png' };
  } finally {
    clearTimeout(id);
  }
}
