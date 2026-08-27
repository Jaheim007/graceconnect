import { createFileRoute } from "@tanstack/react-router";
import AiJobsQueue from "@/pages/admin/studio/AiJobsQueue";

export const Route = createFileRoute("/_app/admin/studio/jobs")({
  component: AiJobsQueue,
});
