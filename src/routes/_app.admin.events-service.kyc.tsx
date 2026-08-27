import { createFileRoute } from "@tanstack/react-router";
import EventsKYCPage from "@/pages/events/EventsKYCPage";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/events-service/kyc")({
  component: () => (
    showServiceSurfaces() ? <EventsKYCPage /> : <Navigate to="/admin" replace />
  ),
});
