import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/tarifs")({
  component: () => (
    <Navigate to="/pricing" replace />
  ),
});
