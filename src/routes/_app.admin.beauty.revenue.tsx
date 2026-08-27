import { createFileRoute } from "@tanstack/react-router";
import BeautyProRevenuePane from "@/pages/beauty/pro/BeautyProRevenuePane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/beauty/revenue")({
  component: () => (
    showServiceSurfaces() ? <BeautyProRevenuePane /> : <Navigate to="/admin" replace />
  ),
});
