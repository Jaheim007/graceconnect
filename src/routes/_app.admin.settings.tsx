import { createFileRoute } from "@tanstack/react-router";
import { AdminSettings as LazyAdminSettings } from "@/pages/admin/AdminPages";

export const Route = createFileRoute("/_app/admin/settings")({
  component: LazyAdminSettings,
});
