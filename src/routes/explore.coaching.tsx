import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/explore/coaching")({
  component: () => (
    <Navigate to="/discover" replace />
  ),
});
