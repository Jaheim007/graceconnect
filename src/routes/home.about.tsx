import { createFileRoute } from "@tanstack/react-router";
import HomeLanding from "@/pages/home/HomeLanding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/home/about")({
  component: () => (
    showServiceSurfaces() ? <HomeLanding /> : <Navigate to="/" replace />
  ),
});
