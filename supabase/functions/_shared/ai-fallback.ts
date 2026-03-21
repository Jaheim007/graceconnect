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

// ─── Gemini 3 Pro Image via Lovable AI Gateway ───

async function gemini3ProImageGenerate(opts: {
  prompt: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content: opts.prompt }],
        modalities: ['image', 'text'],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const t = await res.text();
      const err = new Error(res.status === 429 ? 'Rate limit on Gemini 3 Pro Image' : `Gemini 3 Pro Image error (${res.status})`);
      (err as any).status = res.status;
      (err as any).detail = t.slice(0, 800);
      throw err;
    }

    const data = await res.json();
    const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      const err = new Error('No image returned by Gemini 3 Pro Image');
      (err as any).status = 502;
      throw err;
    }

    // Extract base64 from data URL
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }

    // If it's a regular URL, fetch it and convert
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error('Failed to fetch generated image');
    const buf = await imgRes.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const mimeType = imgRes.headers.get('content-type') || 'image/png';
    return { base64, mimeType };
  } finally {
    clearTimeout(id);
  }
}

// ─── Image Generation with Fallback (Gemini 3 Pro → OpenAI → Gemini Flash) ───

export async function aiGenerateImageBase64(opts: {
  geminiKey: string;
  openaiKey?: string;
  prompt: string;
  size?: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mimeType: string }> {

  // 1️⃣ Try Gemini 3 Pro Image (highest quality) via Lovable AI Gateway
  try {
    console.log('[ai-fallback] Trying Gemini 3 Pro Image (highest quality)...');
    const result = await gemini3ProImageGenerate({
      prompt: opts.prompt,
      timeoutMs: opts.timeoutMs,
    });
    console.log('[ai-fallback] ✅ Gemini 3 Pro Image succeeded');
    return result;
  } catch (proErr: any) {
    if (shouldNotFallback(proErr)) throw proErr;
    console.warn('[ai-fallback] Gemini 3 Pro Image failed:', proErr?.message?.slice(0, 200));
  }

  // 2️⃣ Fallback: OpenAI DALL-E 3
  const openaiKey = opts.openaiKey || Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      console.log('[ai-fallback] Trying OpenAI DALL-E 3...');
      const result = await openaiGenerateImageBase64({
        apiKey: openaiKey,
        prompt: opts.prompt,
        size: opts.size,
        timeoutMs: opts.timeoutMs,
      });
      console.log('[ai-fallback] ✅ OpenAI DALL-E 3 succeeded');
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
    console.log('[ai-fallback] Trying Gemini Flash (direct API)...');
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
