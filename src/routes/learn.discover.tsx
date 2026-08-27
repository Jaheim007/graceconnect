import { createFileRoute } from "@tanstack/react-router";
import EducationDiscover from "@/pages/education/EducationDiscover";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/learn/discover")({
  component: () => (
    showServiceSurfaces() ? <EducationDiscover /> : <Navigate to="/" replace />
  ),
});
