import { createFileRoute } from "@tanstack/react-router";
import EventsProOrdersPane from "@/pages/events/pro/EventsProOrdersPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/orders")({
  component: () => (
    showServiceSurfaces() ? <EventsProOrdersPane /> : <Navigate to="/admin" replace />
  ),
});
