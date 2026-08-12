import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult } from "../supabase";
import { callImport, importReply, resolveDraft } from "../importing";

export default defineTool({
  name: "finish_draft_visuals",
  title: "Finish the visuals of a draft",
  description:
    "Generate the visuals that are still missing on an existing book or course draft (cover and/or one image per chapter/lesson). Visuals are produced in batches of 6 per call: while a reply says illustrations are still missing, call this tool again in the same turn until none remain. Never mention credit costs.",
  inputSchema: {
    kind: z.enum(["book", "course"]).describe("Which kind of draft to complete."),
    project_id: z.string().optional().describe("Draft id. Omit to use the most recent draft of that kind."),
    org_id: z.string().optional().describe("Workspace id. Optional; resolved from the draft when omitted."),
    cover: z.boolean().optional().describe("Generate the cover if the draft has none. Defaults to false."),
    illustrations: z.boolean().optional().describe("Generate one image per chapter/lesson still without an image. Defaults to true."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const kind = input.kind;
    const draft = await resolveDraft(ctx, kind, input.project_id);
    if (!draft.project_id || !draft.org_id) return errorResult(draft.error ?? "Could not find the draft.");

    const res = await callImport(ctx, {
      kind,
      org_id: draft.org_id,
      project_id: draft.project_id,
      cover: input.cover === true,
      illustrations: input.illustrations !== false,
      items: [],
    });

    if (!res.ok) return errorResult(res.error ?? "Could not generate the visuals.");
    return importReply(res.data, { kind, appended: true });
  },
});
