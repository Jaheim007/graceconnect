import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/top-creators")({
  component: () => (
    <Navigate to="/showcase" replace />
  ),
});
