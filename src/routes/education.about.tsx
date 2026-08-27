import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/education/about")({
  component: () => (
    showServiceSurfaces() ? <Navigate to="/learn/about" replace /> : <Navigate to="/" replace />
  ),
});
