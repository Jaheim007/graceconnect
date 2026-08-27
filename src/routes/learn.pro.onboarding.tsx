import { createFileRoute } from "@tanstack/react-router";
import EducationTutorOnboarding from "@/pages/education/EducationTutorOnboarding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/learn/pro/onboarding")({
  component: () => (
    showServiceSurfaces() ? <EducationTutorOnboarding /> : <Navigate to="/" replace />
  ),
});
