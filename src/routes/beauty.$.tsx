import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/beauty/$")({
  component: () => (
    showServiceSurfaces() ? <Navigate to="/beauty/search" replace /> : <Navigate to="/" replace />
  ),
});
