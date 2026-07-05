import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function db(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_org_analytics",
  title: "Get organization analytics",
  description: "Summary of an organization: total purchases, gross revenue, and recent order count over N days.",
  inputSchema: {
    organization_id: z.string().uuid(),
    days: z.number().int().min(1).max(365).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ organization_id, days }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supa = db(ctx);
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const { data, error } = await supa
      .from("purchases")
      .select("amount, currency, status, created_at")
      .eq("organization_id", organization_id)
      .gte("created_at", since);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const paid = rows.filter((r: any) => r.status === "paid" || r.status === "completed" || r.status === "success");
    const byCurrency: Record<string, number> = {};
    for (const r of paid) {
      const c = (r.currency ?? "XOF").toUpperCase();
      byCurrency[c] = (byCurrency[c] ?? 0) + Number(r.amount ?? 0);
    }
    const summary = {
      organization_id,
      window_days: days,
      total_orders: rows.length,
      paid_orders: paid.length,
      gross_revenue_by_currency: byCurrency,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
