/**
 * AI Fallback Layer — strict provider separation:
 * 
 * TEXT: Gemini first → OpenAI fallback
 * IMAGES: Gemini Pro (direct API) → OpenAI DALL-E → Gemini Flash (emergency)
 * 
 * All AI calls use GEMINI_API_KEY / OPENAI_API_KEY directly.
 * NO Lovable AI Gateway is used.
 * 
 * When OpenAI image generation fails and we fall back to Gemini Flash,
 * all superadmins are notified so they can check the OpenAI quota.
 * 
 * Rate-limit (429) and credit (402) errors are NOT retried — they bubble up immediately.
 */

import { geminiGenerateText, extractJson, geminiProImageBase64, geminiGenerateImageBase64 } from './ai-gemini.ts';
import { openaiChat, openaiGenerateImageBase64 } from './ai-openai.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Errors that should NOT trigger fallback (user-side / billing issues) */
function shouldNotFallback(err: any): boolean {
  const status = err?.status;
  return status === 402 || status === 401 || status === 403;
}

/**
 * Notify all superadmins when OpenAI image generation fails.
 * Fire-and-forget — never blocks or throws.
 */
async function notifySuperadminsOpenAIFailure(errorMsg: string, errorStatus?: number) {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;

    const db = createClient(url, key);

    const { data: superadmins } = await db
      .from('user_platform_roles')
      .select('user_id')
      .eq('role', 'superadmin');

    if (!superadmins?.length) return;

    const isQuota = errorStatus === 429 || errorMsg?.toLowerCase().includes('quota') || errorMsg?.toLowerCase().includes('rate limit') || errorMsg?.toLowerCase().includes('insufficient_quota');
    const title = isQuota
      ? '⚠️ OpenAI — Quota épuisé / Rate limit'
      : '⚠️ OpenAI — Génération image échouée';
    const body = isQuota
      ? `La génération d'image OpenAI a échoué (quota/rate-limit). Le système utilise Gemini en secours. Vérifiez le quota OpenAI. Erreur: ${errorMsg?.slice(0, 200)}`
      : `La génération d'image OpenAI a échoué (status ${errorStatus || 'unknown'}). Le système utilise Gemini en secours. Erreur: ${errorMsg?.slice(0, 200)}`;

    const notifications = superadmins.map((sa: any) => ({
      user_id: sa.user_id,
      title,
      body,
      notification_type: 'openai_image_failure',
      action_url: '/superadmin',
    }));

    await db.from('notifications').insert(notifications);
    console.log(`[ai-fallback] Notified ${superadmins.length} superadmin(s) about OpenAI image failure`);
  } catch (notifErr) {
    console.warn('[ai-fallback] Failed to notify superadmins:', (notifErr as any)?.message?.slice(0, 200));
  }
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
  // Try Gemini first (direct API with GEMINI_API_KEY)
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

// ─── Image Generation with Fallback (Gemini Pro → OpenAI DALL-E → Gemini Flash) ───

export async function aiGenerateImageBase64(opts: {
  geminiKey: string;
  openaiKey?: string;
  prompt: string;
  size?: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {

  // 1️⃣ Try Gemini Pro Image (highest quality) via direct Google API
  if (opts.geminiKey) {
    try {
      console.log('[ai-fallback] Trying Gemini Pro Image (direct API, highest quality)...');
      const result = await geminiProImageBase64({
        apiKey: opts.geminiKey,
        prompt: opts.prompt,
        timeoutMs: opts.timeoutMs,
      });
      console.log('[ai-fallback] ✅ Gemini Pro Image succeeded');
      return result;
    } catch (proErr: any) {
      if (shouldNotFallback(proErr)) throw proErr;
      console.warn('[ai-fallback] Gemini Pro Image failed:', proErr?.message?.slice(0, 200));
    }
  }

  // 2️⃣ Fallback: OpenAI DALL-E
  const openaiKey = opts.openaiKey || Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      console.log('[ai-fallback] Trying OpenAI DALL-E...');
      const result = await openaiGenerateImageBase64({
        apiKey: openaiKey,
        prompt: opts.prompt,
        size: opts.size,
        timeoutMs: opts.timeoutMs,
      });
      console.log('[ai-fallback] ✅ OpenAI DALL-E succeeded');
      return result;
    } catch (openaiErr: any) {
      if (shouldNotFallback(openaiErr)) throw openaiErr;
      const errMsg = openaiErr?.message || 'Unknown error';
      const errStatus = openaiErr?.status;
      console.warn('[ai-fallback] OpenAI image failed, falling back to Gemini Flash:', errMsg.slice(0, 200));
      notifySuperadminsOpenAIFailure(errMsg, errStatus);
    }
  }

  // 3️⃣ Last resort: Gemini Flash (direct API)
  try {
    console.log('[ai-fallback] Trying Gemini Flash (direct API, emergency fallback)...');
    return await geminiGenerateImageBase64({
      apiKey: opts.geminiKey,
      prompt: opts.prompt,
      timeoutMs: opts.timeoutMs,
    });
  } catch (geminiErr: any) {
    if (shouldNotFallback(geminiErr)) throw geminiErr;
    throw new Error(`All image providers failed. Last error: ${geminiErr?.message?.slice(0, 200)}`);
  }
}

// Re-export extractJson for convenience
export { extractJson };
