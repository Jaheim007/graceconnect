import { createFileRoute } from "@tanstack/react-router";
import HomeProviderOnboarding from "@/pages/home/HomeProviderOnboarding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/home/pro/onboarding")({
  component: () => (
    showServiceSurfaces() ? <HomeProviderOnboarding /> : <Navigate to="/" replace />
  ),
});
