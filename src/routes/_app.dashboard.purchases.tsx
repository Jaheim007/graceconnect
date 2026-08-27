import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/dashboard/purchases")({
  component: () => (
    <Navigate to="/dashboard/activity?tab=purchases" replace />
  ),
});
