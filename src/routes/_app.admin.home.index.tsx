import { createFileRoute } from "@tanstack/react-router";
import HomeProOverview from "@/pages/home/pro/HomeProOverview";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/")({
  component: () => (
    showServiceSurfaces() ? <HomeProOverview /> : <Navigate to="/admin" replace />
  ),
});
