import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/church/pro/kyc")({
  component: () => (
    <Navigate to="/admin/church/kyc" replace />
  ),
});
