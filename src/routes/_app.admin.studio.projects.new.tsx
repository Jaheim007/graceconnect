import { createFileRoute } from "@tanstack/react-router";
import ProjectWizard from "@/pages/admin/studio/ProjectWizard";

export const Route = createFileRoute("/_app/admin/studio/projects/new")({
  component: ProjectWizard,
});
