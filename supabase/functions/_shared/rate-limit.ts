// Persistent rate limiter for edge functions
// Uses PostgreSQL-backed check_rate_limit() for cold-start resilience
// Falls back to in-memory if DB call fails

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_MAX = 30; // 30 requests per minute
const DEFAULT_WINDOW = 60; // 60 seconds

// In-memory fallback (used if DB is unavailable)
const fallbackCounts = new Map<string, { count: number; windowStart: number }>();

function inMemoryFallback(key: string, maxRequests: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = fallbackCounts.get(key);
  if (!entry || now - entry.windowStart > DEFAULT_WINDOW * 1000) {
    fallbackCounts.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  if (entry.count > maxRequests) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining };
}

export async function rateLimit(
  ip: string | null,
  maxRequests = DEFAULT_MAX,
  windowSeconds = DEFAULT_WINDOW,
): Promise<{ allowed: boolean; remaining: number }> {
  const key = ip || 'unknown';

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return inMemoryFallback(key, maxRequests);

    const db = createClient(url, serviceKey);
    const { data, error } = await db.rpc('check_rate_limit', {
      _key: key,
      _max: maxRequests,
      _window_seconds: windowSeconds,
    });

    if (error || !data) {
      console.warn('[rate-limit] DB fallback:', error?.message);
      return inMemoryFallback(key, maxRequests);
    }

    return { allowed: data.allowed as boolean, remaining: data.remaining as number };
  } catch (err) {
    console.warn('[rate-limit] DB fallback:', err);
    return inMemoryFallback(key, maxRequests);
  }
}
