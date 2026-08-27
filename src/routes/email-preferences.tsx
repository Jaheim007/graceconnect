import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/email-preferences")({
  component: () => (
    <Navigate to="/notification-preferences" replace />
  ),
});
