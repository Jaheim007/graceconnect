import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/dashboard/claim")({
  component: () => (
    <Navigate to="/admin/affiliation" replace />
  ),
});
