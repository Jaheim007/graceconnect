import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/home/$")({
  component: () => (
    showServiceSurfaces() ? <Navigate to="/home/discover" replace /> : <Navigate to="/" replace />
  ),
});
