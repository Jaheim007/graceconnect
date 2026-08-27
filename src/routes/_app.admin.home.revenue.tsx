import { createFileRoute } from "@tanstack/react-router";
import HomeProRevenuePane from "@/pages/home/pro/HomeProRevenuePane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/revenue")({
  component: () => (
    showServiceSurfaces() ? <HomeProRevenuePane /> : <Navigate to="/admin" replace />
  ),
});
