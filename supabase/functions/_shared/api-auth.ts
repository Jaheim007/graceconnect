// Shared API key authentication helper for public API edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface ApiKeyContext {
  apiKeyId: string;
  orgId: string;
  scopes: string[];
}

export interface ApiAuthResult {
  ok: boolean;
  context?: ApiKeyContext;
  error?: string;
  status?: number;
}

/**
 * Hash an API key using SHA-256 (Web Crypto API)
 */
export async function hashApiKey(rawKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a fresh API key (sv_live_<32-char-base62>)
 */
export function generateApiKey(): { raw: string; prefix: string } {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let body = "";
  for (const b of bytes) body += alphabet[b % alphabet.length];
  const raw = `sv_live_${body}`;
  return { raw, prefix: raw.slice(0, 12) }; // sv_live_XXXX
}

/**
 * Authenticate an incoming request using the Authorization: Bearer <api_key> header
 */
export async function authenticateApiKey(
  req: Request,
  requiredScope?: string,
): Promise<ApiAuthResult> {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "missing_authorization", status: 401 };
  }
  const rawKey = authHeader.slice("Bearer ".length).trim();
  if (!rawKey.startsWith("sv_live_")) {
    return { ok: false, error: "invalid_key_format", status: 401 };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: "server_misconfigured", status: 500 };
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const keyHash = await hashApiKey(rawKey);
  const { data, error } = await supabase.rpc("verify_api_key", { _key_hash: keyHash });

  if (error || !data || data.length === 0) {
    return { ok: false, error: "invalid_api_key", status: 401 };
  }

  const row = data[0] as {
    api_key_id: string;
    org_id: string;
    scopes: string[] | null;
    is_valid: boolean;
  };

  if (!row.is_valid) {
    return { ok: false, error: "key_revoked_or_expired", status: 401 };
  }

  const scopes = Array.isArray(row.scopes) ? row.scopes : [];

  if (requiredScope && !scopes.includes(requiredScope)) {
    return { ok: false, error: `missing_scope:${requiredScope}`, status: 403 };
  }

  return {
    ok: true,
    context: {
      apiKeyId: row.api_key_id,
      orgId: row.org_id,
      scopes,
    },
  };
}

/**
 * Best-effort logging of API request (does not block the response on failure)
 */
export async function logApiRequest(
  ctx: ApiKeyContext | null,
  req: Request,
  endpoint: string,
  statusCode: number,
  startedAt: number,
): Promise<void> {
  try {
    if (!ctx) return;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    await supabase.rpc("log_api_request", {
      _api_key_id: ctx.apiKeyId,
      _org_id: ctx.orgId,
      _endpoint: endpoint,
      _method: req.method,
      _status_code: statusCode,
      _latency_ms: Date.now() - startedAt,
      _ip_address: req.headers.get("x-forwarded-for") ?? null,
      _user_agent: req.headers.get("user-agent") ?? null,
    });
  } catch (e) {
    console.error("logApiRequest failed:", e);
  }
}
