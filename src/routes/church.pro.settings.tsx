import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/church/pro/settings")({
  component: () => (
    <Navigate to="/admin/church/settings" replace />
  ),
});
