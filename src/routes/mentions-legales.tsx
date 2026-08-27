import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/mentions-legales")({
  component: () => (
    <Navigate to="/legal-notices" replace />
  ),
});
