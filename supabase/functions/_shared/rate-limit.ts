// Simple in-memory rate limiter for edge functions
// Uses a sliding window approach with IP-based tracking

const requestCounts = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX = 30; // 30 requests per minute

export function rateLimit(ip: string | null, maxRequests = DEFAULT_MAX): { allowed: boolean; remaining: number } {
  const key = ip || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining };
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 5) {
      requestCounts.delete(key);
    }
  }
}, 300_000);
