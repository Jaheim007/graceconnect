import { createFileRoute } from "@tanstack/react-router";
import EducationProSettingsPane from "@/pages/education/pro/EducationProSettingsPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/settings")({
  component: () => (
    showServiceSurfaces() ? <EducationProSettingsPane /> : <Navigate to="/admin" replace />
  ),
});
