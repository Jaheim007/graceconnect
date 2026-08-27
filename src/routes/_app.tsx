import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/layout/RouteGuard";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/_app")({
  component: () => (
    <RequireAuth><AppLayout /></RequireAuth>
  ),
});
