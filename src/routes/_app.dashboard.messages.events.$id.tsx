import { createFileRoute } from "@tanstack/react-router";
import EventsConversation from "@/pages/events/EventsConversation";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/dashboard/messages/events/$id")({
  component: () => (
    showServiceSurfaces() ? <EventsConversation /> : <Navigate to="/dashboard/messages" replace />
  ),
});
