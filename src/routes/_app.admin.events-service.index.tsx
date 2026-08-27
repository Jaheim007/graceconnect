import { createFileRoute } from "@tanstack/react-router";
import EventsProOverview from "@/pages/events/pro/EventsProOverview";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/")({
  component: () => (
    showServiceSurfaces() ? <EventsProOverview /> : <Navigate to="/admin" replace />
  ),
});
