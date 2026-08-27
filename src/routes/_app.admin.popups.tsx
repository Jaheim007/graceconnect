import { createFileRoute } from "@tanstack/react-router";
import AdminPopups from "@/pages/admin/AdminPopups";

export const Route = createFileRoute("/_app/admin/popups")({
  component: AdminPopups,
});
