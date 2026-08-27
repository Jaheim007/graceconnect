import { createFileRoute } from "@tanstack/react-router";
import BeautyProviderProfile from "@/pages/beauty/BeautyProviderProfile";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/beauty/p/$slug")({
  component: () => (
    showServiceSurfaces() ? <BeautyProviderProfile /> : <Navigate to="/" replace />
  ),
});
