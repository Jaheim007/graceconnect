/**
 * Shared Supabase/runtime helpers for the SiteViral MCP server.
 *
 * Import-safe by design: no env reads, no I/O at module scope (the entry is
 * evaluated at build time and on cold start, where secrets are absent).
 */
import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

export function supabaseProjectUrl(): string {
  const url = configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) is required");
  return url.replace(/\/$/, "");
}

export function supabasePublishableKey(): string {
  const direct = configuredEnv(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed: unknown = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys.default, ...Object.values(keys)]
          .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
          ?.trim();
        if (key) return key;
      }
    } catch {
      /* malformed dictionary — fall through to the legacy names */
    }
  }
  const legacy = configuredEnv(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error("SUPABASE_PUBLISHABLE_KEY, SUPABASE_PUBLISHABLE_KEYS or SUPABASE_ANON_KEY is required");
}

/** Client bound to the verified caller — RLS runs as that user. */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("supabaseForUser requires a verified OAuth token");
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Public app base used for deep links returned to the assistant. */
export const APP_BASE_URL = "https://siteviral.com";

export function textResult(text: string, structured?: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text }],
    ...(structured ? { structuredContent: structured } : {}),
  };
}

export function errorResult(text: string) {
  return { content: [{ type: "text" as const, text }], isError: true };
}

/**
 * Call an existing SiteViral edge function with the caller's own token, so
 * credit checks, studio permissions and audit logs all run unchanged.
 */
export async function callEdgeFunction<T = any>(
  ctx: ToolContext,
  name: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const token = ctx.getToken();
  if (!token) return { ok: false, status: 401, data: null, error: "Not authenticated" };

  const res = await fetch(`${supabaseProjectUrl()}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: supabasePublishableKey(),
    },
    body: JSON.stringify(body),
  });

  let data: any = null;
  const raw = await res.text();
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw ? { error: raw.slice(0, 500) } : null;
  }

  if (!res.ok || data?.error) {
    return { ok: false, status: res.status, data, error: data?.error || `${name} failed (${res.status})` };
  }
  return { ok: true, status: res.status, data };
}

export interface ResolvedOrg {
  id: string;
  name: string;
  role: string;
}

/**
 * Resolve the workspace to create in. Uses the given id when provided,
 * otherwise the caller's single studio-capable workspace.
 */
export async function resolveOrg(
  ctx: ToolContext,
  orgId?: string,
): Promise<{ org?: ResolvedOrg; error?: string }> {
  const supa = supabaseForUser(ctx);
  const { data, error } = await supa
    .from("organization_members")
    .select("role, organization_id, organizations(id, name)")
    .eq("user_id", ctx.getUserId())
    .in("role", ["owner", "admin", "editor"]);

  if (error) return { error: error.message };
  const rows = (data ?? []).map((m: any) => ({
    id: m.organization_id as string,
    name: (m.organizations?.name as string) ?? "Workspace",
    role: m.role as string,
  }));

  if (rows.length === 0) {
    return {
      error:
        "No workspace found where you can create content. Create your platform first at " +
        `${APP_BASE_URL}/create-org`,
    };
  }

  if (orgId) {
    const match = rows.find((r) => r.id === orgId);
    if (!match) return { error: `You are not an owner/admin/editor of workspace ${orgId}.` };
    return { org: match };
  }

  if (rows.length > 1) {
    const list = rows.map((r) => `- ${r.name} (${r.id})`).join("\n");
    return {
      error:
        "You have several workspaces. Ask which one to use and pass its org_id:\n" + list,
    };
  }

  return { org: rows[0] };
}
