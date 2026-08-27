import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/sell")({
  component: () => (
    <Navigate to="/vendre" replace />
  ),
});
