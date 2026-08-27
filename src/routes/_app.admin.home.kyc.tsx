import { createFileRoute } from "@tanstack/react-router";
import HomeKYCPage from "@/pages/home/HomeKYCPage";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/kyc")({
  component: () => (
    showServiceSurfaces() ? <HomeKYCPage /> : <Navigate to="/admin" replace />
  ),
});
