import { createFileRoute } from "@tanstack/react-router";
import AdminViralTools from "@/pages/admin/AdminViralTools";

export const Route = createFileRoute("/_app/admin/viral-tools")({
  component: AdminViralTools,
});
