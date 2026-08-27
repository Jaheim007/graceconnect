import { createFileRoute } from "@tanstack/react-router";
import BeautyProSettingsPane from "@/pages/beauty/pro/BeautyProSettingsPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/beauty/settings")({
  component: () => (
    showServiceSurfaces() ? <BeautyProSettingsPane /> : <Navigate to="/admin" replace />
  ),
});
