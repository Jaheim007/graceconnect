import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/create-course")({
  component: () => (
    <Navigate to="/creer-formation" replace />
  ),
});
