import { createFileRoute } from "@tanstack/react-router";
import BeautyProOverview from "@/pages/beauty/pro/BeautyProOverview";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/beauty/")({
  component: () => (
    showServiceSurfaces() ? <BeautyProOverview /> : <Navigate to="/admin" replace />
  ),
});
