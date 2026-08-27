import { createFileRoute } from "@tanstack/react-router";
import { AdminAnnouncements as LazyAdminAnnouncements } from "@/pages/admin/AdminPages";

export const Route = createFileRoute("/_app/admin/announcements/")({
  component: LazyAdminAnnouncements,
});
