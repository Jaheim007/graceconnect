import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/events/$")({
  component: () => (
    showServiceSurfaces() ? <Navigate to="/events/discover" replace /> : <Navigate to="/" replace />
  ),
});
