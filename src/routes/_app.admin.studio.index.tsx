import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/admin/studio/")({
  component: () => (
    <Navigate to="/ecrire" replace />
  ),
});
