import { createFileRoute } from "@tanstack/react-router";
import SuperadminFullDashboard from "@/pages/superadmin/SuperadminFullDashboard";

export const Route = createFileRoute("/superadmin/")({
  component: SuperadminFullDashboard,
});
