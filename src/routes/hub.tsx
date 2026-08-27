import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/hub")({
  component: () => (
    <Navigate to="/discover" replace />
  ),
});
