import { createFileRoute } from "@tanstack/react-router";
import ProjectOverview from "@/pages/admin/studio/ProjectOverview";

export const Route = createFileRoute("/_app/admin/studio/projects/$id/")({
  component: ProjectOverview,
});
