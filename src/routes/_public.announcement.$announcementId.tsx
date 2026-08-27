import { createFileRoute } from "@tanstack/react-router";
import AnnouncementDetailPage from "@/pages/AnnouncementDetailPage";

export const Route = createFileRoute("/_public/announcement/$announcementId")({
  component: AnnouncementDetailPage,
});
