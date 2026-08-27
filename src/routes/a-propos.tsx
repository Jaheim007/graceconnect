import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/a-propos")({
  component: () => (
    <Navigate to="/about" replace />
  ),
});
