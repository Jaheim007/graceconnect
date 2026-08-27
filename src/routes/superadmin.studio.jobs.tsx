import { createFileRoute } from "@tanstack/react-router";
import SuperadminGlobalJobs from "@/pages/superadmin/studio/GlobalAiJobsMonitor";

export const Route = createFileRoute("/superadmin/studio/jobs")({
  component: SuperadminGlobalJobs,
});
