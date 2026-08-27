import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/feed")({
  component: () => (
    <Navigate to="/discover" replace />
  ),
});
