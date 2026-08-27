import { createFileRoute } from "@tanstack/react-router";
import BeautyLanding from "@/pages/beauty/BeautyLanding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/beauty/about")({
  component: () => (
    showServiceSurfaces() ? <BeautyLanding /> : <Navigate to="/" replace />
  ),
});
