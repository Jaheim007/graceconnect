import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

export const Route = createFileRoute("/_app/dashboard/promotions")({
  component: () => (
    <Navigate to="/admin/promo-codes" replace />
  ),
});
