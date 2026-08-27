import { createFileRoute } from "@tanstack/react-router";
import EventsProSettingsPane from "@/pages/events/pro/EventsProSettingsPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/settings")({
  component: () => (
    showServiceSurfaces() ? <EventsProSettingsPane /> : <Navigate to="/admin" replace />
  ),
});
