import { createFileRoute } from "@tanstack/react-router";
import EducationProOverview from "@/pages/education/pro/EducationProOverview";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/")({
  component: () => (
    showServiceSurfaces() ? <EducationProOverview /> : <Navigate to="/admin" replace />
  ),
});
