import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/layout/RouteGuard";
import ReferralsPage from "@/pages/ReferralsPage";

export const Route = createFileRoute("/referrals")({
  component: () => (
    <RequireAuth><ReferralsPage /></RequireAuth>
  ),
});
