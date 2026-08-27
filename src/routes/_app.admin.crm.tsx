import { createFileRoute } from "@tanstack/react-router";
import AdminCRM from "@/pages/admin/AdminCRM";

export const Route = createFileRoute("/_app/admin/crm")({
  component: AdminCRM,
});
