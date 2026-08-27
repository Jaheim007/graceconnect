import { createFileRoute } from "@tanstack/react-router";
import { AdminEvents as LazyAdminEvents } from "@/pages/admin/AdminPages";

export const Route = createFileRoute("/_app/admin/events/")({
  component: LazyAdminEvents,
});
