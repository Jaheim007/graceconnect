/**
 * AI Fallback Layer — Gemini first, OpenAI fallback. ALWAYS.
 * 
 * Every AI call goes through here so that if the primary fails (500, 503, timeout, etc.)
 * the system automatically retries with the fallback before giving up.
 * 
 * TEXT: Gemini first → OpenAI fallback
 * IMAGES: OpenAI first → Gemini fallback (better quality for covers/illustrations)
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

// ─── Text Generation with Fallback (Gemini → OpenAI) ───

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

// ─── Image Generation with Fallback (OpenAI FIRST → Gemini fallback) ───
// OpenAI produces higher quality images for covers, illustrations, etc.

export async function aiGenerateImageBase64(opts: {
  geminiKey: string;
  openaiKey?: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  const openaiKey = opts.openaiKey || Deno.env.get('OPENAI_API_KEY');

  // Try OpenAI FIRST for images
  if (openaiKey) {
    try {
      return await openaiGenerateImageBase64({
        apiKey: openaiKey,
        prompt: opts.prompt,
        timeoutMs: opts.timeoutMs,
      });
    } catch (openaiErr: any) {
      if (shouldNotFallback(openaiErr)) throw openaiErr;
      console.warn('[ai-fallback] OpenAI image failed, falling back to Gemini:', openaiErr?.message?.slice(0, 200));
    }
  }

  // Fallback to Gemini
  try {
    return await geminiGenerateImageBase64({
      apiKey: opts.geminiKey,
      prompt: opts.prompt,
      timeoutMs: opts.timeoutMs,
    });
  } catch (geminiErr: any) {
    if (shouldNotFallback(geminiErr)) throw geminiErr;
    throw new Error(`Both OpenAI and Gemini image generation failed. Last error: ${geminiErr?.message?.slice(0, 200)}`);
  }
}

// Re-export extractJson for convenience
export { extractJson };
