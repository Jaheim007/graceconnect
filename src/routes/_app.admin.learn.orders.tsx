import { createFileRoute } from "@tanstack/react-router";
import EducationProOrdersPane from "@/pages/education/pro/EducationProOrdersPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/orders")({
  component: () => (
    showServiceSurfaces() ? <EducationProOrdersPane /> : <Navigate to="/admin" replace />
  ),
});
