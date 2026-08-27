import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/dashboard/kyc")({
  component: () => (
    <Navigate to="/admin/kyc" replace />
  ),
});
