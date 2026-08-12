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

export default defineTool({
  name: "create_book_draft",
  title: "Create a book draft",
  description:
    "Create an ebook draft on SiteViral and generate its outline with AI. Uses the app's own Studio generation engine and the user's credits. Returns a job id and a link to the draft project, where the creator writes/expands chapters and decides on pricing and publishing.",
  inputSchema: {
    title: z.string().describe("Working title of the book."),
    topic: z.string().describe("What the book is about — subject, angle, promise."),
    target_audience: z.string().optional().describe("Who the book is for."),
    tone: z.string().optional().describe("Tone of voice, e.g. professional, warm, direct."),
    chapter_count: z.number().int().optional().describe("Desired number of chapters (4-20). Defaults to 8."),
    language: z.enum(["fr", "en"]).optional().describe("Book language. Defaults to French."),
    org_id: z.string().optional().describe("Workspace id. Required only when the user has several."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const title = input.title?.trim() ?? "";
    const topic = input.topic?.trim() ?? "";
    if (title.length < 2) return errorResult("Please give the book a title.");
    if (topic.length < 10) return errorResult("Please describe what the book is about (at least 10 characters).");

    const chapters = Math.min(20, Math.max(4, Math.round(input.chapter_count ?? 8)));
    const language = input.language ?? "fr";

    const { org, error } = await resolveOrg(ctx, input.org_id);
    if (!org) return errorResult(error ?? "No workspace available.");

    const supa = supabaseForUser(ctx);
    const { data: project, error: projErr } = await supa
      .from("ai_content_projects")
      .insert({
        organization_id: org.id,
        created_by: ctx.getUserId(),
        project_type: "ebook",
        status: "draft",
        title: title.slice(0, 200),
        description: topic.slice(0, 2000),
        language,
        tone: input.tone?.trim() || null,
        target_audience: input.target_audience?.trim() || null,
        data_json: {
          topic,
          style: "ebook",
          chapterCount: chapters,
          created_via: "mcp",
        },
        structure_json: { step: 1, chapters: [] },
      })
      .select("id")
      .single();

    if (projErr || !project) {
      return errorResult(`Could not create the book draft: ${projErr?.message ?? "unknown error"}`);
    }

    const created = await callEdgeFunction(ctx, "ai-create-job", {
      org_id: org.id,
      project_id: project.id,
      job_type: "generate_outline",
      input_params: {
        title,
        topic,
        language,
        chapter_count: chapters,
        tone: input.tone?.trim() || undefined,
        target_audience: input.target_audience?.trim() || undefined,
        created_via: "mcp",
      },
    });

    if (!created.ok) return errorResult(created.error ?? "Could not queue the outline generation.");

    const jobId = ((created.data as any)?.job_id ?? (created.data as any)?.id) as string;
    const run = await callEdgeFunction(ctx, "ai-run-job", { job_id: jobId });
    const link = `${APP_BASE_URL}/ecrire`;

    return textResult(
      `Book draft "${title}" created in "${org.name}" with ${chapters} planned chapters.\n` +
        `Job id: ${jobId}${run.ok ? "" : " (queued — the app will run it)"}\n` +
        `Draft: ${link}\n` +
        "Use get_generation_status to follow the outline generation. Chapters, cover, pricing and publishing happen in the app.",
      { project_id: project.id, job_id: jobId, org_id: org.id, draft_url: link, chapters },
    );
  },
});
