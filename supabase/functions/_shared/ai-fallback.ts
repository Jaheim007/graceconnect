/**
 * AI Fallback Layer — strict provider separation:
 * 
 * TEXT: Gemini first → OpenAI fallback
 * IMAGES: OpenAI first → Gemini fallback
 * 
 * When OpenAI image generation fails and we fall back to Gemini,
 * all superadmins are notified so they can check the OpenAI quota.
 * 
 * Rate-limit (429) and credit (402) errors are NOT retried — they bubble up immediately.
 */

import { geminiGenerateText, extractJson, geminiGenerateImageBase64 } from './ai-gemini.ts';
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

    // Get all superadmin user IDs
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
    // Never let notification errors affect the main flow
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

export async function aiGenerateImageBase64(opts: {
  geminiKey: string;
  openaiKey?: string;
  prompt: string;
  size?: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  const openaiKey = opts.openaiKey || Deno.env.get('OPENAI_API_KEY');

  // Try OpenAI FIRST for images
  if (openaiKey) {
    try {
      return await openaiGenerateImageBase64({
        apiKey: openaiKey,
        prompt: opts.prompt,
        size: opts.size,
        timeoutMs: opts.timeoutMs,
      });
    } catch (openaiErr: any) {
      if (shouldNotFallback(openaiErr)) throw openaiErr;
      
      const errMsg = openaiErr?.message || 'Unknown error';
      const errStatus = openaiErr?.status;
      console.warn('[ai-fallback] OpenAI image failed, falling back to Gemini:', errMsg.slice(0, 200));
      
      // Fire-and-forget: notify superadmins about the failure
      notifySuperadminsOpenAIFailure(errMsg, errStatus);
    }
  } else {
    // No OpenAI key at all — also notify
    notifySuperadminsOpenAIFailure('OPENAI_API_KEY not configured', undefined);
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
