import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  APP_BASE_URL,
  callEdgeFunction,
  errorResult,
  resolveOrg,
  supabaseForUser,
  textResult,
} from "../supabase";

const MAX_CHARS = 120_000;

export default defineTool({
  name: "create_course_from_text",
  title: "Create a course draft from pasted text",
  description:
    "Start an AI course draft on SiteViral from source material the user pastes (notes, transcript, article, outline). Uses the same document-to-course engine as the app and charges the user's credits. Returns a job id and a link to the draft; nothing is published automatically.",
  inputSchema: {
    source_text: z.string().describe("The raw source material to turn into a course."),
    title: z.string().optional().describe("Optional course title."),
    language: z.enum(["fr", "en"]).optional().describe("Course language. Defaults to French."),
    tier: z.enum(["standard", "premium"]).optional().describe("Defaults to standard."),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("Audience level."),
    generate_images: z.boolean().optional().describe("One illustration per lesson (extra credits)."),
    org_id: z.string().optional().describe("Workspace id. Required only when the user has several."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const source = input.source_text?.trim() ?? "";
    if (source.length < 400) {
      return errorResult(
        "The pasted text is too short to build a course from. Paste at least a few paragraphs, or use create_course_from_prompt instead.",
      );
    }
    if (source.length > MAX_CHARS) {
      return errorResult(`The pasted text is too long (max ${MAX_CHARS} characters).`);
    }

    const { org, error } = await resolveOrg(ctx, input.org_id);
    if (!org) return errorResult(error ?? "No workspace available.");

    // Store the text as a .txt source file so the existing document pipeline
    // handles it exactly like an uploaded document.
    const supa = supabaseForUser(ctx);
    const path = `mcp-text/${org.id}/${Date.now()}-${crypto.randomUUID()}.txt`;
    const { error: upErr } = await supa.storage
      .from("media")
      .upload(path, new Blob([source], { type: "text/plain" }), { contentType: "text/plain" });
    if (upErr) return errorResult(`Could not store the source text: ${upErr.message}`);
    const { data: urlData } = supa.storage.from("media").getPublicUrl(path);

    const res = await callEdgeFunction(ctx, "course-from-document", {
      org_id: org.id,
      source: "document",
      file_url: urlData.publicUrl,
      file_name: `${(input.title?.trim() || "source").slice(0, 60)}.txt`,
      mime: "text/plain",
      title: input.title?.trim() || undefined,
      language: input.language ?? "fr",
      tier: input.tier ?? "standard",
      level: input.level ?? "beginner",
      generate_images: input.generate_images === true,
    });

    if (!res.ok) return errorResult(res.error ?? "Course generation could not be started.");

    const projectId = (res.data as any)?.project_id as string;
    const jobId = (res.data as any)?.job_id as string;
    const words = (res.data as any)?.words as number | undefined;
    const link = `${APP_BASE_URL}/admin/programs/draft/${projectId}`;

    return textResult(
      `Course generation started in "${org.name}" from ${words ?? "the pasted"} words of source material.\n` +
        `Job id: ${jobId}\nDraft: ${link}\n` +
        "Use get_generation_status to follow progress. The creator reviews, prices and publishes in the app.",
      { project_id: projectId, job_id: jobId, org_id: org.id, draft_url: link, words },
    );
  },
});
