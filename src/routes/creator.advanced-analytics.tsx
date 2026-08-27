import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/creator/advanced-analytics")({
  component: () => (
    <Navigate to="/creator/analytics" replace />
  ),
});
