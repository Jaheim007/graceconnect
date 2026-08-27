import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/start-selling")({
  component: () => (
    <Navigate to="/create-org" replace />
  ),
});
