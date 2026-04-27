// Public REST API entrypoint — authenticated by API key (Bearer sv_live_...)
// Routes:
//   GET  /public-api/v1/products                — list org products
//   GET  /public-api/v1/products/:id            — single product
//   GET  /public-api/v1/orders?limit=50         — recent orders
//   GET  /public-api/v1/analytics/summary       — basic KPIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticateApiKey, logApiRequest } from "../_shared/api-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  const startedAt = Date.now();
  const url = new URL(req.url);
  // Strip "/public-api" prefix injected by Supabase routing
  const path = url.pathname.replace(/^\/public-api/, "") || "/";

  // Authenticate
  const auth = await authenticateApiKey(req, "read");
  if (!auth.ok || !auth.context) {
    const status = auth.status ?? 401;
    const resp = json({ error: auth.error ?? "unauthorized" }, status);
    await logApiRequest(null, req, path, status, startedAt);
    return resp;
  }
  const { orgId } = auth.context;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let response: Response;

  try {
    // ---- /v1/products ----
    if (req.method === "GET" && path === "/v1/products") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
      const { data, error } = await supabase
        .from("offerings")
        .select("id, title, description, price, currency, type, is_free, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      response = json({ data });
    }
    // ---- /v1/products/:id ----
    else if (req.method === "GET" && path.startsWith("/v1/products/")) {
      const id = path.split("/")[3];
      const { data, error } = await supabase
        .from("offerings")
        .select("id, title, description, price, currency, type, is_free, created_at")
        .eq("organization_id", orgId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        response = json({ error: "not_found" }, 404);
      } else {
        response = json({ data });
      }
    }
    // ---- /v1/orders ----
    else if (req.method === "GET" && path === "/v1/orders") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
      const { data, error } = await supabase
        .from("purchases")
        .select("id, offering_id, amount, currency, status, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      response = json({ data });
    }
    // ---- /v1/analytics/summary ----
    else if (req.method === "GET" && path === "/v1/analytics/summary") {
      const { count: productCount } = await supabase
        .from("offerings")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);

      const { data: recent } = await supabase
        .from("purchases")
        .select("amount, currency, status, created_at")
        .eq("organization_id", orgId)
        .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString());

      const completed = (recent ?? []).filter((p) => p.status === "completed");
      const revenue30d = completed.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

      response = json({
        data: {
          products_total: productCount ?? 0,
          orders_30d: completed.length,
          revenue_30d: revenue30d,
        },
      });
    } else {
      response = json({ error: "not_found", path }, 404);
    }
  } catch (e) {
    console.error("public-api error:", e);
    response = json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }

  await logApiRequest(auth.context, req, path, response.status, startedAt);
  return response;
});
