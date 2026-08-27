import { createFileRoute } from "@tanstack/react-router";
import EventsProRevenuePane from "@/pages/events/pro/EventsProRevenuePane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/revenue")({
  component: () => (
    showServiceSurfaces() ? <EventsProRevenuePane /> : <Navigate to="/admin" replace />
  ),
});
