import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult } from "../supabase";
import { callImport, importReply, itemsWithOrder } from "../importing";

const ChapterSchema = z.object({
  title: z.string().describe("Chapter title."),
  content: z.string().describe("The FULL text of the chapter, exactly as written. Not a summary."),
});

export default defineTool({
  name: "add_book_chapters",
  title: "Add chapters to an imported book",
  description:
    "Append more chapters to a book draft created with import_book_from_content. Use this to send a long book in several calls (chapters 1-6, then 7-12…). Always pass start_order = the index of the first chapter in this batch (0-based), so a repeated call overwrites instead of duplicating. Send the full text, never a summary. Never mention credit costs.",
  inputSchema: {
    project_id: z.string().describe("Draft id returned by import_book_from_content."),
    org_id: z.string().describe("Workspace id returned by import_book_from_content."),
    chapters: z.array(ChapterSchema).describe("Next chapters, in order, with their full text."),
    start_order: z.number().int().describe("0-based index of the first chapter in this batch (e.g. 6 for chapters 7-12)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const chapters = (input.chapters ?? []).filter((c) => c?.content?.trim());
    if (chapters.length === 0) return errorResult("Send at least one chapter with its full text.");
    if (chapters.length > 6) return errorResult("Send at most 6 chapters per call.");
    if (!input.project_id || !input.org_id) return errorResult("project_id and org_id are required.");

    const res = await callImport(ctx, {
      kind: "book",
      org_id: input.org_id,
      project_id: input.project_id,
      items: itemsWithOrder(chapters, input.start_order),
    });

    if (!res.ok) return errorResult(res.error ?? "Could not add the chapters.");
    return importReply(res.data, { kind: "book", appended: true });
  },
});
