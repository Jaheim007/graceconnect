import { createFileRoute } from "@tanstack/react-router";
import EventsProviderPublic from "@/pages/events/EventsProviderPublic";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/events/pro/$slug")({
  component: () => (
    showServiceSurfaces() ? <EventsProviderPublic /> : <Navigate to="/" replace />
  ),
});
