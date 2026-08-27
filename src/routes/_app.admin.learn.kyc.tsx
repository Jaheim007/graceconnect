import { createFileRoute } from "@tanstack/react-router";
import EducationKYCPage from "@/pages/education/EducationKYCPage";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/kyc")({
  component: () => (
    showServiceSurfaces() ? <EducationKYCPage /> : <Navigate to="/admin" replace />
  ),
});
