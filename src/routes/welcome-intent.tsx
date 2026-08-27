import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/layout/RouteGuard";
import WelcomeIntentPage from "@/pages/WelcomeIntentPage";

export const Route = createFileRoute("/welcome-intent")({
  component: () => (
    <RequireAuth><WelcomeIntentPage /></RequireAuth>
  ),
});
