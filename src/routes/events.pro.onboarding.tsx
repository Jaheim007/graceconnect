import { createFileRoute } from "@tanstack/react-router";
import EventsProviderOnboarding from "@/pages/events/EventsProviderOnboarding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/events/pro/onboarding")({
  component: () => (
    showServiceSurfaces() ? <EventsProviderOnboarding /> : <Navigate to="/" replace />
  ),
});
