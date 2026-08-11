import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { APP_BASE_URL, callEdgeFunction, errorResult, resolveOrg, textResult } from "../supabase";

export default defineTool({
  name: "create_course_from_prompt",
  title: "Create a course draft from a brief",
  description:
    "Start an AI course draft on SiteViral from a plain brief (topic + options). Runs the same generation engine as the app, charges the user's credits, and returns a job id plus a link to the draft. The draft is never published automatically — the creator reviews, prices and publishes it in the app.",
  inputSchema: {
    topic: z
      .string()
      .describe("What the course should teach. One or two sentences describing subject and goal."),
    title: z.string().optional().describe("Optional course title. Generated from the topic when omitted."),
    language: z.enum(["fr", "en"]).optional().describe("Course language. Defaults to French."),
    tier: z
      .enum(["standard", "premium"])
      .optional()
      .describe("standard = 8-12 lessons, premium = 14-18 deeper lessons. Defaults to standard."),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("Audience level."),
    generate_images: z
      .boolean()
      .optional()
      .describe("Generate one illustration per lesson. Costs extra credits. Defaults to false."),
    org_id: z.string().optional().describe("Workspace id. Required only when the user has several."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");

    const topic = input.topic?.trim() ?? "";
    if (topic.length < 10) return errorResult("Please give a fuller brief (at least 10 characters).");
    if (topic.length > 2000) return errorResult("The brief is too long — keep it under 2000 characters.");

    const { org, error } = await resolveOrg(ctx, input.org_id);
    if (!org) return errorResult(error ?? "No workspace available.");

    const res = await callEdgeFunction(ctx, "course-from-document", {
      org_id: org.id,
      source: "prompt",
      prompt: topic,
      title: input.title?.trim() || undefined,
      language: input.language ?? "fr",
      tier: input.tier ?? "standard",
      level: input.level ?? "beginner",
      generate_images: input.generate_images === true,
    });

    if (!res.ok) return errorResult(res.error ?? "Course generation could not be started.");

    const projectId = (res.data as any)?.project_id as string;
    const jobId = (res.data as any)?.job_id as string;
    const link = `${APP_BASE_URL}/admin/programs/draft/${projectId}`;

    return textResult(
      `Course generation started in "${org.name}" (${input.tier ?? "standard"} tier).\n` +
        `Job id: ${jobId}\nDraft: ${link}\n` +
        "Use get_generation_status with this job id to follow progress. Nothing is published until the creator reviews and prices the course in the app.",
      { project_id: projectId, job_id: jobId, org_id: org.id, draft_url: link },
    );
  },
});
