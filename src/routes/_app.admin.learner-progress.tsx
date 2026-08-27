import { createFileRoute } from "@tanstack/react-router";
import AdminLearnerProgress from "@/pages/admin/AdminLearnerProgress";

export const Route = createFileRoute("/_app/admin/learner-progress")({
  component: AdminLearnerProgress,
});
