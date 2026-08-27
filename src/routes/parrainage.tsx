import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/parrainage")({
  component: () => (
    <Navigate to="/referrals" replace />
  ),
});
