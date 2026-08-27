import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/cgu")({
  component: () => (
    <Navigate to="/terms" replace />
  ),
});
