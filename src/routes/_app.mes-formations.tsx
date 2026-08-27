import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/mes-formations")({
  component: () => (
    <Navigate to="/my-purchases?tab=courses" replace />
  ),
});
