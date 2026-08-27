import { createFileRoute } from "@tanstack/react-router";
import BeautyKYCPage from "@/pages/beauty/BeautyKYCPage";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/beauty/kyc")({
  component: () => (
    showServiceSurfaces() ? <BeautyKYCPage /> : <Navigate to="/admin" replace />
  ),
});
