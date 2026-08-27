import { createFileRoute } from "@tanstack/react-router";
import EventsProConversationPane from "@/pages/events/pro/EventsProConversationPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/messages/$id")({
  component: () => (
    showServiceSurfaces() ? <EventsProConversationPane /> : <Navigate to="/admin" replace />
  ),
});
