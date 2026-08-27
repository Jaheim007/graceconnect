import { createFileRoute } from "@tanstack/react-router";
import ProjectAssets from "@/pages/admin/studio/ProjectAssets";

export const Route = createFileRoute("/_app/admin/studio/projects/$id/assets")({
  component: ProjectAssets,
});
