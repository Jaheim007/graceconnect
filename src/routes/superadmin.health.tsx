import { createFileRoute } from "@tanstack/react-router";
import SuperadminHealthDashboard from "@/pages/superadmin/SuperadminHealthDashboard";

export const Route = createFileRoute("/superadmin/health")({
  component: SuperadminHealthDashboard,
});
