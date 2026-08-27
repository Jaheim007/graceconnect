import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/church/pro/sermons/")({
  component: () => (
    <Navigate to="/admin/church/sermons" replace />
  ),
});
