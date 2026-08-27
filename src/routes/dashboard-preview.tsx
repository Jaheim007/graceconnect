import { createFileRoute } from "@tanstack/react-router";
import { RequireSuperadmin } from "@/components/layout/RouteGuard";
import DashboardPreview from "@/pages/DashboardPreview";

export const Route = createFileRoute("/dashboard-preview")({
  component: () => (
    <RequireSuperadmin><DashboardPreview /></RequireSuperadmin>
  ),
});
