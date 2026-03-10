/**
 * AI Fallback Layer — Gemini first, OpenAI fallback. ALWAYS.
 * 
 * Every AI call goes through here so that if Gemini fails (500, 503, timeout, etc.)
 * the system automatically retries with OpenAI before giving up.
 * 
 * Rate-limit (429) and credit (402) errors are NOT retried — they bubble up immediately.
 */

import { geminiGenerateText, extractJson, geminiGenerateImageBase64 } from './ai-gemini.ts';
import { openaiChat, openaiGenerateImageBase64 } from './ai-openai.ts';

/** Errors that should NOT trigger fallback (user-side / billing issues) */
function shouldNotFallback(err: any): boolean {
  const status = err?.status;
  return status === 402 || status === 401 || status === 403;
}

// ─── Text Generation with Fallback ───

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
  // Try Gemini first
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
    // 429 on Gemini: also try OpenAI
    console.warn('[ai-fallback] Gemini text failed, falling back to OpenAI:', geminiErr?.message?.slice(0, 200));
  }

  // Fallback to OpenAI
  const openaiKey = opts.openaiKey || Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('Gemini failed and no OpenAI key available for fallback');
  }

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

// ─── Image Generation with Fallback ───

export async function aiGenerateImageBase64(opts: {
  geminiKey: string;
  openaiKey?: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  // Try Gemini first
  try {
    return await geminiGenerateImageBase64({
      apiKey: opts.geminiKey,
      prompt: opts.prompt,
      timeoutMs: opts.timeoutMs,
    });
  } catch (geminiErr: any) {
    if (shouldNotFallback(geminiErr)) throw geminiErr;
    console.warn('[ai-fallback] Gemini image failed, falling back to OpenAI:', geminiErr?.message?.slice(0, 200));
  }

  // Fallback to OpenAI DALL-E
  const openaiKey = opts.openaiKey || Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('Gemini image failed and no OpenAI key available for fallback');
  }

  return await openaiGenerateImageBase64({
    apiKey: openaiKey,
    prompt: opts.prompt,
    timeoutMs: opts.timeoutMs,
  });
}

// Re-export extractJson for convenience
export { extractJson };
