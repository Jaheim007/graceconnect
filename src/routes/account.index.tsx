import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/account/")({
  component: () => (
    <Navigate to="/billing" replace />
  ),
});
