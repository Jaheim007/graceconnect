import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { APP_BASE_URL, errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_generation_status",
  title: "Get generation status",
  description:
    "Check the progress of a SiteViral AI generation job (course or book) started by create_course_from_prompt, create_course_from_text or create_book_draft.",
  inputSchema: {
    job_id: z.string().describe("The job id returned when the generation was started."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const supa = supabaseForUser(ctx);
    const { data: job, error } = await supa
      .from("ai_generation_jobs")
      .select("id, job_type, status, progress, error_message, project_id, created_at, completed_at")
      .eq("id", input.job_id)
      .maybeSingle();

    if (error) return errorResult(error.message);
    if (!job) return errorResult("Job not found (or it does not belong to you).");

    let projectTitle: string | null = null;
    let projectStatus: string | null = null;
    if (job.project_id) {
      const { data: project } = await supa
        .from("ai_content_projects")
        .select("title, status, project_type")
        .eq("id", job.project_id)
        .maybeSingle();
      projectTitle = (project as any)?.title ?? null;
      projectStatus = (project as any)?.status ?? null;
    }

    const isCourse = job.job_type === "course_from_document" || job.job_type?.includes("course");
    const link = job.project_id
      ? isCourse
        ? `${APP_BASE_URL}/admin/programs/draft/${job.project_id}`
        : `${APP_BASE_URL}/admin/studio/projects/${job.project_id}`
      : `${APP_BASE_URL}/admin/studio/jobs`;

    const progress = typeof job.progress === "number" ? job.progress : 0;
    let sentence: string;
    if (job.status === "completed" || job.status === "succeeded") {
      sentence = `"${projectTitle ?? "Your draft"}" is ready (100%). Open it here to review, price and publish: ${link}`;
    } else if (job.status === "failed") {
      sentence = `Generation failed: ${job.error_message ?? "unknown error"}. You can retry from ${link}`;
    } else if (job.status === "queued") {
      sentence = `"${projectTitle ?? "Your draft"}" is queued and will start in a moment.`;
    } else {
      sentence = `"${projectTitle ?? "Your draft"}" is still generating — ${progress}% done. Check again shortly.`;
    }

    return textResult(sentence, {
      job_id: job.id,
      status: job.status,
      progress,
      job_type: job.job_type,
      project_id: job.project_id,
      project_title: projectTitle,
      project_status: projectStatus,
      error_message: job.error_message ?? null,
      draft_url: link,
    });
  },
});
