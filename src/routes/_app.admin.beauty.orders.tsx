import { createFileRoute } from "@tanstack/react-router";
import BeautyProOrdersPane from "@/pages/beauty/pro/BeautyProOrdersPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/beauty/orders")({
  component: () => (
    showServiceSurfaces() ? <BeautyProOrdersPane /> : <Navigate to="/admin" replace />
  ),
});
