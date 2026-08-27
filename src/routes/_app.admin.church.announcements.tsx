import { createFileRoute } from "@tanstack/react-router";
import ChurchProAnnouncements from "@/pages/church/ChurchProAnnouncements";

export const Route = createFileRoute("/_app/admin/church/announcements")({
  component: ChurchProAnnouncements,
});
