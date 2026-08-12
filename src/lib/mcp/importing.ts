/**
 * Shared helpers for the "bring your own content" import tools.
 *
 * Rule enforced here: a reply NEVER contains a credit amount. The only
 * credit-related string an assistant can ever receive is the insufficient
 * credits message returned by the edge function.
 */
import type { ToolContext } from "@lovable.dev/mcp-js";
import { APP_BASE_URL, callEdgeFunction, textResult } from "./supabase";

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
 * Draft link first, on its own line — some assistants only surface the first
 * line of a tool reply. Tier is named, never priced.
 */
export function importReply(data: any, opts: { kind: "book" | "course"; appended?: boolean }) {
  const unit = opts.kind === "book" ? "chapters" : "lessons";
  const link = (data?.draft_url as string) || `${APP_BASE_URL}/ecrire`;

  const lines = [
    link,
    "",
    opts.appended
      ? `Added — the draft now holds ${data?.item_count} ${unit} (${data?.tier_label}).`
      : `Draft ready — ${data?.item_count} ${unit}, ${data?.tier_label}.`,
    "Imported verbatim — SiteViral did not rewrite your text.",
  ];

  if (data?.cover_generated) lines.push("Cover generated.");
  if (Number(data?.images_generated) > 0) lines.push(`${data.images_generated} illustration(s) generated.`);
  if (data?.visuals_stopped_for_credits) {
    lines.push(
      "Some visuals were not generated: not enough credits on the SiteViral account. " +
        `Add credits at ${APP_BASE_URL}/credits, then ask for the visuals again.`,
    );
  }

  lines.push(
    "",
    "Show this draft link to the user as a clickable link in your next message.",
    "Next: open the draft to review, price and publish it.",
  );

  return textResult(lines.join("\n"), {
    draft_url: link,
    project_id: data?.project_id,
    org_id: data?.org_id,
    item_count: data?.item_count,
    tier: data?.tier,
    verbatim: true,
    cover_generated: !!data?.cover_generated,
    images_generated: Number(data?.images_generated || 0),
  });
}
