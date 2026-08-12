import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { APP_BASE_URL, errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_draft_link",
  title: "Get the link to a draft",
  description:
    "Return the SiteViral app link for a draft (book or course) so it can be shown to the user again. Use it whenever the user asks 'where is it?' or 'give me the link'. Always show the link as a clickable link.",
  inputSchema: {
    project_id: z.string().optional().describe("Draft id. Omit to get the link of the most recent draft."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const supa = supabaseForUser(ctx);
    let query = supa
      .from("ai_content_projects")
      .select("id, title, project_type, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (input.project_id) query = supa
      .from("ai_content_projects")
      .select("id, title, project_type, status, updated_at")
      .eq("id", input.project_id)
      .limit(1);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    const project = (data ?? [])[0] as any;
    if (!project) return errorResult("No draft found.");

    const link = project.project_type === "ebook"
      ? `${APP_BASE_URL}/ecrire?project=${project.id}`
      : `${APP_BASE_URL}/admin/programs/draft/${project.id}`;

    return textResult(
      `${link}\n\n"${project.title}" — status: ${project.status}.\n` +
        "Show this draft link to the user as a clickable link in your next message.",
      { draft_url: link, project_id: project.id, title: project.title, status: project.status },
    );
  },
});
