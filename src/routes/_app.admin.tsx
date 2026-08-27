import { createFileRoute } from "@tanstack/react-router";
import { RequireOrgManage } from "@/components/layout/RouteGuard";
import AdminShell from "@/pages/admin/AdminShell";

export const Route = createFileRoute("/_app/admin")({
  component: () => (
    <RequireOrgManage><AdminShell /></RequireOrgManage>
  ),
});
