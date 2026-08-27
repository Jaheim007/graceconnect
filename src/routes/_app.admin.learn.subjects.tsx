import { createFileRoute } from "@tanstack/react-router";
import EducationTutorSubjects from "@/pages/education/EducationTutorSubjects";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/subjects")({
  component: () => (
    showServiceSurfaces() ? <EducationTutorSubjects /> : <Navigate to="/admin" replace />
  ),
});
