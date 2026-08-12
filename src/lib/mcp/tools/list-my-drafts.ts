import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { APP_BASE_URL, errorResult, resolveOrg, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_drafts",
  title: "List my drafts",
  description:
    "List the signed-in creator's recent SiteViral drafts (books, courses and other AI projects) with their status and a direct link into the app.",
  inputSchema: {
    org_id: z.string().optional().describe("Workspace id. Required only when the user has several."),
    limit: z.number().int().optional().describe("How many drafts to return (1-25). Defaults to 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const { org, error } = await resolveOrg(ctx, input.org_id);
    if (!org) return errorResult(error ?? "No workspace available.");

    const limit = Math.min(25, Math.max(1, Math.round(input.limit ?? 10)));
    const supa = supabaseForUser(ctx);
    const { data, error: qErr } = await supa
      .from("ai_content_projects")
      .select("id, title, project_type, status, language, updated_at")
      .eq("organization_id", org.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (qErr) return errorResult(qErr.message);

    const rows = (data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      type: p.project_type,
      status: p.status,
      language: p.language,
      updated_at: p.updated_at,
      url:
        p.project_type === "course_pack"
          ? `${APP_BASE_URL}/admin/programs/draft/${p.id}`
          : `${APP_BASE_URL}/ecrire?project=${p.id}`,
    }));

    if (rows.length === 0) {
      return textResult(`No drafts yet in "${org.name}".`, { org_id: org.id, drafts: [] });
    }

    const lines = rows
      .map((r) => `- ${r.title} — ${r.type}, ${r.status} (${r.language})\n  ${r.url}`)
      .join("\n");

    return textResult(`Recent drafts in "${org.name}":\n${lines}`, { org_id: org.id, drafts: rows });
  },
});
