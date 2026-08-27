import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/digital/")({
  component: () => (
    <Navigate to="/discover?type=digital" replace />
  ),
});
