import { createFileRoute } from "@tanstack/react-router";
import EventsProMessagesPane from "@/pages/events/pro/EventsProMessagesPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/messages")({
  component: () => (
    showServiceSurfaces() ? <EventsProMessagesPane /> : <Navigate to="/admin" replace />
  ),
});
