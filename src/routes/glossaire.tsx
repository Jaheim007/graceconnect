import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/glossaire")({
  component: () => (
    <Navigate to="/glossary" replace />
  ),
});
