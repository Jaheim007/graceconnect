import { createFileRoute } from "@tanstack/react-router";
import EventsDiscover from "@/pages/events/EventsDiscover";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/events/discover")({
  component: () => (
    showServiceSurfaces() ? <EventsDiscover /> : <Navigate to="/" replace />
  ),
});
