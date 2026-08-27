import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/admin/kyc")({
  component: () => (
    <Navigate to="/admin/settings?s=verification" replace />
  ),
});
