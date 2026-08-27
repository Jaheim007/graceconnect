import { createFileRoute } from "@tanstack/react-router";
import ProjectPublishWizard from "@/pages/admin/studio/ProjectPublishWizard";

export const Route = createFileRoute("/_app/admin/studio/projects/$id/publish")({
  component: ProjectPublishWizard,
});
