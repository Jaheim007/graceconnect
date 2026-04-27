// Public REST API entrypoint — authenticated by API key (Bearer sv_live_...)
// Routes (path prefix /public-api stripped by Supabase routing):
//   GET  /v1/products                 — list org published products
//   GET  /v1/products/:id             — single product (must be in caller's org)
//   GET  /v1/orders?limit=50          — recent product purchases
//   GET  /v1/analytics/summary        — basic 30-day KPIs
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
  const path = url.pathname.replace(/^\/public-api/, "") || "/";

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
    if (req.method === "GET" && path === "/v1/products") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
      const { data, error } = await supabase
        .from("digital_products")
        .select("id, slug, title, description, price, sale_price, currency, product_type, is_free, is_pwyw, sales_count, created_at")
        .eq("organization_id", orgId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      response = json({ data });
    } else if (req.method === "GET" && path.startsWith("/v1/products/")) {
      const id = path.split("/")[3];
      const { data, error } = await supabase
        .from("digital_products")
        .select("id, slug, title, description, price, sale_price, currency, product_type, is_free, is_pwyw, sales_count, created_at")
        .eq("organization_id", orgId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      response = data ? json({ data }) : json({ error: "not_found" }, 404);
    } else if (req.method === "GET" && path === "/v1/orders") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
      const { data, error } = await supabase
        .from("product_purchases")
        .select("id, product_id, amount, currency, status, gateway, buyer_email, completed_at, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      response = json({ data });
    } else if (req.method === "GET" && path === "/v1/analytics/summary") {
      const { count: productCount } = await supabase
        .from("digital_products")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("is_published", true);

      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: recent } = await supabase
        .from("product_purchases")
        .select("amount, status, organization_amount")
        .eq("organization_id", orgId)
        .gte("created_at", since);

      const completed = (recent ?? []).filter((p) => p.status === "completed");
      const revenue30d = completed.reduce(
        (sum, p) => sum + Number(p.organization_amount ?? p.amount ?? 0),
        0,
      );

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
