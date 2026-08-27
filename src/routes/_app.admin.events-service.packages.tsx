import { createFileRoute } from "@tanstack/react-router";
import EventsProPackages from "@/pages/events/EventsProPackages";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/packages")({
  component: () => (
    showServiceSurfaces() ? <EventsProPackages /> : <Navigate to="/admin" replace />
  ),
});
