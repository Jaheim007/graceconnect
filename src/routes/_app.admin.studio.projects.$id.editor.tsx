import { createFileRoute } from "@tanstack/react-router";
import ProjectEditor from "@/pages/admin/studio/ProjectEditor";

export const Route = createFileRoute("/_app/admin/studio/projects/$id/editor")({
  component: ProjectEditor,
});
