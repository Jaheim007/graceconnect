import { createFileRoute } from "@tanstack/react-router";
import EducationTutorPublic from "@/pages/education/EducationTutorPublic";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/learn/pro/$slug")({
  component: () => (
    showServiceSurfaces() ? <EducationTutorPublic /> : <Navigate to="/" replace />
  ),
});
