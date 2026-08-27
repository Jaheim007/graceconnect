import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementForm as AdminAnnouncementForm } from "@/pages/admin/AdminAnnouncementForm";

export const Route = createFileRoute("/_app/admin/announcements/$id/edit")({
  component: AdminAnnouncementForm,
});
