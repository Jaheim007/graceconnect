import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/earn")({
  component: () => (
    <Navigate to="/gagner" replace />
  ),
});
