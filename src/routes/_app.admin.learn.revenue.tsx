import { createFileRoute } from "@tanstack/react-router";
import EducationProRevenuePane from "@/pages/education/pro/EducationProRevenuePane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/revenue")({
  component: () => (
    showServiceSurfaces() ? <EducationProRevenuePane /> : <Navigate to="/admin" replace />
  ),
});
