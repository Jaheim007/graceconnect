import { createFileRoute } from "@tanstack/react-router";
import ProjectReviewQualityGate from "@/pages/admin/studio/ProjectReviewQualityGate";

export const Route = createFileRoute("/_app/admin/studio/projects/$id/review")({
  component: ProjectReviewQualityGate,
});
