import { createFileRoute } from "@tanstack/react-router";
import HomeProOrdersPane from "@/pages/home/pro/HomeProOrdersPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/orders")({
  component: () => (
    showServiceSurfaces() ? <HomeProOrdersPane /> : <Navigate to="/admin" replace />
  ),
});
