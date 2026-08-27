import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/resources")({
  component: () => (
    <Navigate to="/my-purchases" replace />
  ),
});
