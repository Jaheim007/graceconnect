import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/education/pro/onboarding")({
  component: () => (
    showServiceSurfaces() ? <Navigate to="/learn/pro/onboarding" replace /> : <Navigate to="/" replace />
  ),
});
