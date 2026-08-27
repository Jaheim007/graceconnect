import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/protection")({
  component: () => (
    <Navigate to="/security" replace />
  ),
});
