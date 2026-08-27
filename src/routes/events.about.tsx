import { createFileRoute } from "@tanstack/react-router";
import EventsLanding from "@/pages/events/EventsLanding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/events/about")({
  component: () => (
    showServiceSurfaces() ? <EventsLanding /> : <Navigate to="/" replace />
  ),
});
