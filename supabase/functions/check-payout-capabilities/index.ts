import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * check-payout-capabilities: Query Paystack API to determine available
 * payout methods (MoMo, bank) for a given currency/country.
 * 
 * Results are cached in-memory for 24h to avoid excessive API calls.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory cache with 24h TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiter
const requestCounts = new Map<string, { count: number; windowStart: number }>();
function checkRateLimit(ip: string | null, max = 10): boolean {
  const key = ip || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now - entry.windowStart > 60000) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

interface BankEntry {
  id: number;
  name: string;
  slug: string;
  code: string;
  type: string;
  currency: string;
  active: boolean;
}

interface CapabilityResult {
  currency: string;
  type: string;
  supported: boolean;
  providers: Array<{ code: string; name: string }>;
  cached: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  if (!checkRateLimit(clientIp, 10)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Supported queries
    const queries = [
      { currency: 'XOF', type: 'mobile_money' },
      { currency: 'XOF', type: 'bank' },
      { currency: 'GHS', type: 'mobile_money' },
      { currency: 'GHS', type: 'bank' },
      { currency: 'KES', type: 'mobile_money' },
      { currency: 'KES', type: 'bank' },
      { currency: 'NGN', type: 'nuban' },
      { currency: 'ZAR', type: 'bank' },
    ];

    const results: CapabilityResult[] = [];

    for (const q of queries) {
      const cacheKey = `${q.currency}:${q.type}`;
      const cached = cache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        results.push(cached.data as CapabilityResult);
        continue;
      }

      // Query Paystack /bank endpoint
      try {
        const url = `https://api.paystack.co/bank?currency=${q.currency}&type=${q.type}`;
        const psRes = await fetch(url, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        });
        const psData = await psRes.json();

        const providers: Array<{ code: string; name: string }> = [];
        if (psData.status && Array.isArray(psData.data)) {
          for (const bank of psData.data as BankEntry[]) {
            if (bank.active) {
              providers.push({ code: bank.code, name: bank.name });
            }
          }
        }

        const result: CapabilityResult = {
          currency: q.currency,
          type: q.type,
          supported: providers.length > 0,
          providers,
          cached: false,
        };

        cache.set(cacheKey, { data: { ...result, cached: true }, expiresAt: Date.now() + CACHE_TTL });
        results.push(result);
      } catch (fetchErr) {
        console.error(`Failed to query Paystack for ${cacheKey}:`, fetchErr);
        results.push({
          currency: q.currency,
          type: q.type,
          supported: false,
          providers: [],
          cached: false,
        });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      capabilities: results,
      timestamp: new Date().toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('check-payout-capabilities error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
