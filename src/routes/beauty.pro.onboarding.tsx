import { createFileRoute } from "@tanstack/react-router";
import BeautyProviderOnboarding from "@/pages/beauty/BeautyProviderOnboarding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/beauty/pro/onboarding")({
  component: () => (
    showServiceSurfaces() ? <BeautyProviderOnboarding /> : <Navigate to="/" replace />
  ),
});
