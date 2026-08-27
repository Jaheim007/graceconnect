import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/digital/about")({
  component: () => (
    <Navigate to="/landing" replace />
  ),
});
