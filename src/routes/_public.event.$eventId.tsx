import { createFileRoute } from "@tanstack/react-router";
import EventDetailPage from "@/pages/EventDetailPage";

export const Route = createFileRoute("/_public/event/$eventId")({
  component: EventDetailPage,
});
