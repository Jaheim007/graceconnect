/**
 * Shared helpers for the "bring your own content" import tools.
 *
 * Rule enforced here: a reply NEVER contains a credit amount. The only
 * credit-related string an assistant can ever receive is the insufficient
 * credits message returned by the edge function.
 */
import type { ToolContext } from "@lovable.dev/mcp-js";
import { APP_BASE_URL, callEdgeFunction, supabaseForUser, textResult } from "./supabase";

export interface ImportItemInput {
  title?: string;
  content: string;
}

export interface ImportPayload {
  kind: "book" | "course";
  org_id: string;
  project_id?: string;
  title?: string;
  description?: string;
  target_audience?: string;
  language?: string;
  source_assistant?: string;
  cover?: boolean;
  illustrations?: boolean;
  total_items?: number;
  items: Array<{ title?: string; content: string; order?: number }>;
  idempotency_key?: string;
}

export function itemsWithOrder(items: ImportItemInput[], startOrder?: number) {
  const start = Number.isFinite(Number(startOrder)) ? Math.max(0, Math.round(Number(startOrder))) : undefined;
  return items.map((it, i) => ({
    title: it.title,
    content: it.content,
    ...(start === undefined ? {} : { order: start + i }),
  }));
}

export async function callImport(ctx: ToolContext, payload: ImportPayload) {
  return callEdgeFunction(ctx, "import-content", payload as unknown as Record<string, unknown>);
}

/**
 * Find the draft to append to when the assistant did not keep the ids from the
 * first import call (most clients only read the text of a tool reply).
 */
export async function resolveDraft(
  ctx: ToolContext,
  kind: "book" | "course",
  projectId?: string,
): Promise<{ project_id?: string; org_id?: string; title?: string; error?: string }> {
  const supa = supabaseForUser(ctx);
  const type = kind === "book" ? "ebook" : "course_pack";

  let q = supa
    .from("ai_content_projects")
    .select("id, title, organization_id, project_type, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (projectId) {
    q = supa
      .from("ai_content_projects")
      .select("id, title, organization_id, project_type, updated_at")
      .eq("id", projectId)
      .limit(1);
  } else {
    q = q.eq("project_type", type);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };
  const row = (data ?? [])[0] as any;
  if (!row) {
    return {
      error: projectId
        ? `No draft found with id ${projectId}.`
        : `No ${kind} draft found. Create it first with import_${kind}_from_content.`,
    };
  }
  return { project_id: row.id as string, org_id: row.organization_id as string, title: row.title as string };
}

/**
 * Draft link first, on its own line — some assistants only surface the first
 * line of a tool reply. Tier is named, never priced.
 *
 * The ids are printed in the text on purpose: most MCP clients never read
 * structuredContent, so without this an assistant cannot append the next batch.
 */
export function importReply(data: any, opts: { kind: "book" | "course"; appended?: boolean }) {
  const unit = opts.kind === "book" ? "chapters" : "lessons";
  const link = (data?.draft_url as string) || `${APP_BASE_URL}/ecrire`;
  const nextTool = opts.kind === "book" ? "add_book_chapters" : "add_course_lessons";
  const count = Number(data?.item_count || 0);
  const expected = Number(data?.expected_item_count || 0);
  const remaining = expected ? Math.max(0, expected - count) : 0;
  const complete = expected ? remaining === 0 : undefined;

  const lines = [
    link,
    "",
    expected
      ? `${count} of ${expected} ${unit} are in the draft (${data?.tier_label}).`
      : opts.appended
        ? `Added — the draft now holds ${count} ${unit} (${data?.tier_label}).`
        : `Draft ready — ${count} ${unit}, ${data?.tier_label}.`,
    "Imported verbatim — SiteViral did not rewrite your text.",
  ];

  if (data?.cover_generated) lines.push("Cover generated.");
  if (Number(data?.images_generated) > 0) lines.push(`${data.images_generated} illustration(s) generated.`);
  if (Number(data?.images_missing) > 0) {
    lines.push(
      `${data.images_missing} illustration(s) are still missing — call finish_draft_visuals NOW with the ids below (illustrations: true) and repeat until none remain.`,
    );
  }
  if (data?.visuals_stopped_for_credits) {
    lines.push(
      "Some visuals were not generated: not enough credits on the SiteViral account. " +
        `Add credits at ${APP_BASE_URL}/credits, then ask for the visuals again.`,
    );
  }

  lines.push(
    "",
    "IDS FOR THE NEXT BATCH — copy these exact values, never invent them:",
    `project_id: ${data?.project_id}`,
    `org_id: ${data?.org_id}`,
  );

  if (complete === false) {
    lines.push(
      "",
      `NOT FINISHED — ${remaining} ${unit} are still missing.`,
      `Call ${nextTool} NOW with the next batch (up to 12 ${unit} per call), project_id above and start_order: ${count}.`,
      "Do NOT tell the user the import is done, and do NOT stop, until this reply says the draft is complete.",
    );
  } else {
    lines.push(
      `If more ${unit} remain, send them with ${nextTool} using those ids and start_order: ${count}.`,
      `If you lost the ids, call ${nextTool} without them: SiteViral appends to this same draft.`,
    );
    if (complete === true) lines.push(`All ${expected} ${unit} are in the draft — the import is complete.`);
  }

  lines.push(
    "",
    "Show this draft link to the user as a clickable link in your next message — it opens the exact draft.",
    "Next: open the draft to review, price and publish it.",
  );

  return textResult(lines.join("\n"), {
    draft_url: link,
    project_id: data?.project_id,
    org_id: data?.org_id,
    item_count: count,
    expected_item_count: expected || null,
    remaining: expected ? remaining : null,
    complete: complete ?? null,
    next_tool: nextTool,
    next_start_order: count,
    tier: data?.tier,
    verbatim: true,
    cover_generated: !!data?.cover_generated,
    images_generated: Number(data?.images_generated || 0),
    images_missing: Number(data?.images_missing || 0),
  });
}

