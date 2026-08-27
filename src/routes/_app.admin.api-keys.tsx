import { createFileRoute } from "@tanstack/react-router";
import AdminApiKeys from "@/pages/admin/AdminApiKeys";

export const Route = createFileRoute("/_app/admin/api-keys")({
  component: AdminApiKeys,
});
