import { createFileRoute } from "@tanstack/react-router";
import HomeProServices from "@/pages/home/HomeProServices";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/services")({
  component: () => (
    showServiceSurfaces() ? <HomeProServices /> : <Navigate to="/admin" replace />
  ),
});
