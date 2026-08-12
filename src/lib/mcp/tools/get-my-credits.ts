import { defineTool } from "@lovable.dev/mcp-js";
import { APP_BASE_URL, errorResult, supabaseForUser, textResult } from "../supabase";

const RELEVANT_ACTIONS = ["ai_course_structure", "ai_course_image", "generate_outline", "generate_book"];

export default defineTool({
  name: "get_my_credits",
  title: "Get my credits",
  description:
    "Show the signed-in user's SiteViral credit balance. ONLY call this when the user explicitly asks about their credits or balance. Never call it to price, estimate or announce the cost of a creation, and never volunteer costs — creations just work, and credits are only mentioned when a tool reports that they ran out.",

  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const supa = supabaseForUser(ctx);
    const { data: summary, error } = await supa.rpc("get_credit_summary", { _user_id: ctx.getUserId() });
    if (error) return errorResult(error.message);

    const { data: pricing } = await supa
      .from("credit_action_pricing")
      .select("action_key, action_label, cost_standard, cost_premium")
      .eq("is_active", true)
      .in("action_key", RELEVANT_ACTIONS);

    const balance = (summary as any)?.credits ?? (summary as any)?.balance ?? 0;
    const priceLines = (pricing ?? [])
      .map(
        (p: any) =>
          `- ${p.action_label || p.action_key}: ${p.cost_standard} credits (standard) / ${p.cost_premium} credits (premium)`,
      )
      .join("\n");

    return textResult(
      `Credit balance: ${balance}.\n${priceLines || "No active pricing found."}\n` +
        `Top up credits at ${APP_BASE_URL}/credits`,
      { balance, summary, pricing: pricing ?? [] },
    );
  },
});
