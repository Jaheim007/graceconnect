// Authenticated function (called from dashboard) to create/list/revoke API keys
// Auth: Supabase user JWT — caller must be owner/admin of the org.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateApiKey, hashApiKey } from "../_shared/api-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    // Validate caller identity using anon client + user JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "invalid_user" }, 401);

    // Service-role client for membership check + writes
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";
    const orgId = url.searchParams.get("org_id");

    if (!orgId) return json({ error: "missing_org_id" }, 400);

    // Verify caller is owner/admin of org
    const { data: member, error: memberErr } = await adminClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberErr || !member || !["owner", "admin"].includes(String(member.role))) {
      return json({ error: "forbidden" }, 403);
    }

    // ---------- LIST ----------
    if (req.method === "GET" && action === "list") {
      const { data, error } = await adminClient
        .from("api_keys")
        .select("id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ keys: data ?? [] });
    }

    // ---------- CREATE ----------
    if (req.method === "POST" && action === "create") {
      const body = await req.json().catch(() => ({}));
      const name = String(body?.name ?? "").trim();
      const scopesInput: unknown = body?.scopes;
      const scopes = Array.isArray(scopesInput) && scopesInput.every((s) => typeof s === "string")
        ? (scopesInput as string[]).filter((s) => ["read", "write"].includes(s))
        : ["read"];

      if (!name || name.length > 80) return json({ error: "invalid_name" }, 400);
      if (scopes.length === 0) return json({ error: "invalid_scopes" }, 400);

      const { raw, prefix } = generateApiKey();
      const keyHash = await hashApiKey(raw);

      const { data, error } = await adminClient
        .from("api_keys")
        .insert({
          org_id: orgId,
          created_by: user.id,
          name,
          key_prefix: prefix,
          key_hash: keyHash,
          scopes,
        })
        .select("id, name, key_prefix, scopes, created_at")
        .single();

      if (error) return json({ error: error.message }, 500);

      // Return raw key ONCE — never stored
      return json({ key: data, raw_key: raw });
    }

    // ---------- REVOKE ----------
    if (req.method === "POST" && action === "revoke") {
      const body = await req.json().catch(() => ({}));
      const keyId = String(body?.key_id ?? "");
      if (!keyId) return json({ error: "missing_key_id" }, 400);

      const { error } = await adminClient
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", keyId)
        .eq("org_id", orgId);

      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("api-keys-manage error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
