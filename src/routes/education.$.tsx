import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/education/$")({
  component: () => (
    showServiceSurfaces() ? <Navigate to="/learn/discover" replace /> : <Navigate to="/" replace />
  ),
});
