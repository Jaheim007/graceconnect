import { createFileRoute } from "@tanstack/react-router";
import AdminWaitlists from "@/pages/admin/AdminWaitlists";

export const Route = createFileRoute("/_app/admin/waitlists")({
  component: AdminWaitlists,
});
