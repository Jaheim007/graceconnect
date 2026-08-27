import { createFileRoute } from "@tanstack/react-router";
import SuperAppHub from "@/pages/SuperAppHub";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/superapp")({
  component: () => (
    showServiceSurfaces() ? <SuperAppHub /> : <Navigate to="/" replace />
  ),
});
