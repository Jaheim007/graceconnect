import { createFileRoute } from "@tanstack/react-router";
import HomeProSettingsPane from "@/pages/home/pro/HomeProSettingsPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/settings")({
  component: () => (
    showServiceSurfaces() ? <HomeProSettingsPane /> : <Navigate to="/admin" replace />
  ),
});
