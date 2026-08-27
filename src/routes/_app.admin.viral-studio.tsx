import { createFileRoute } from "@tanstack/react-router";
import ViralStudioPage from "@/pages/admin/ViralStudioPage";

export const Route = createFileRoute("/_app/admin/viral-studio")({
  component: ViralStudioPage,
});
