import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/dashboard/products")({
  component: () => (
    <Navigate to="/admin/products" replace />
  ),
});
