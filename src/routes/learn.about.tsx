import { createFileRoute } from "@tanstack/react-router";
import EducationLanding from "@/pages/education/EducationLanding";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/learn/about")({
  component: () => (
    showServiceSurfaces() ? <EducationLanding /> : <Navigate to="/" replace />
  ),
});
