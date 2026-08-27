import { createFileRoute } from "@tanstack/react-router";
import { RequireSuperadmin } from "@/components/layout/RouteGuard";
import SuperadminLayout from "@/pages/superadmin/SuperadminLayout";

export const Route = createFileRoute("/superadmin")({
  component: () => (
    <RequireSuperadmin><SuperadminLayout /></RequireSuperadmin>
  ),
});
