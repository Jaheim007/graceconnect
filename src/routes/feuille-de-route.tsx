import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/feuille-de-route")({
  component: () => (
    <Navigate to="/roadmap" replace />
  ),
});
